# Проксі та АРІ рефлексії

ECMAScript 5 та ECMAScript 6 розроблялись таким чином, щоб демістифікувати функціональність JavaScript. Наприклад, до ECMAScript 5 середовища JavaScript містили неперелічувані властивості, які неможливо було змінювати, проте розробники не могли створити власних неперелічуваних і незмінюваних властивостей. ECMAScript 5 вводив метод `Object.defineProperty()` щоб дозволити розробникам робити те, що рушії JavaScript вже вміли робити.

ECMAScript 6 дає розробникам глибший доступ до можливостей рушія JavaScript через введення вбудованих об’єктів. Щоб дозволити розробникам створювати вбудовані об’єкти, мова відкриває внутрішнє влаштування об’єктів через *проксі (proxies)*, які є прошарком, що може перервати і змінити низькорівневі операції у рушієві JavaScript. Ця глава починається з детального опису проблеми, яку мають вирішити проксі, а після того розкаже про те, як ви можете створювати та ефективно використовувати проксі.

## Проблема масивів

До ECMASCript 6, об’єкти–масиви у JavaScript поводились так, що розробники не могли зімітувати їх поведінку у своїх власних об’єктах. У масивах властивість `length` змінюється, коли ви присвоюєте значення певним елементам масиву. Ви також можете змінювати елементи масиву шляхом зміни властивості `length`. Наприклад:

```js
let colors = ["red", "green", "blue"];

console.log(colors.length);         // 3

colors[3] = "black";

console.log(colors.length);         // 4
console.log(colors[3]);             // "black"

colors.length = 2;

console.log(colors.length);         // 2
console.log(colors[3]);             // undefined
console.log(colors[2]);             // undefined
console.log(colors[1]);             // "green"
```

Спочатку масив `colors` містить три елементи. Присвоєння `"black"` у `colors[3]` автоматично збільшує властивість `length` до `4`. Встановлення властивості `length` значення `2` видаляє останні два елементи з масиву, залишаючи лише перші два. Ніщо у ECMAScript 5 не дозволяло розробникам отримати таку поведінку, проте проксі змінюють це.

I> Саме через таку нестандартну поведінку масиви вважаються спеціальними об’єктами у ECMAScript 6.

## Що таке проксі та рефлексія?

Ви можете створити проксі для використання замість іншого об’єкта (який називають *ціллю (target)*) через виклик `new Proxy()`. Проксі *віртуалізує (virtualizes)* ціль так, що проксі та ціль здаватимуться одним і тим самим об’єктом для функціональності через проксі. Так що проксі і ціль функціонально є одним і тим же об'єктом за допомогою проксі-сервера.

Проксі дозволяють перервати низькорівневі об’єктні операції на цілі, що в іншому випадку були б внутрішніми для рушія JavaScript. Ці низькорівневі операції перериваються з допомогою *перехоплень (trap)*, які є функціями, що відповідають певним операціям.

API рефлексії, якому відповідає об’єкт `Reflect`, є колекцією методів, що надають цю поведінку за замовчуванням для тих самих низькорівневих операцій, які проксі можуть перевизначити. Для кожного перехоплення `Reflect` має відповідний метод. Ці методи мають таке ж ім’я і отримують такі ж аргументи, що і їх відповідні перехоплення. Таблиця 11-1 зводить ці методи.

**Таблиця 11-1: Перехоплення проксі у JavaScript**

| Перехоплення проксі      | Перезаписує поведінку        | Поведінка за замовчуванням |
|--------------------------|------------------------------|-----------------|
|`get`                     | Читання значення властивості | `Reflect.get()` |
|`set`                     | Запис властивості            | `Reflect.set()` |
|`has`                     | Оператор `in`                | `Reflect.has()` |
|`deleteProperty`          | Оператор `delete`            | `Reflect.deleteProperty()` |
|`getPrototypeOf`          | `Object.getPrototypeOf()`    | `Reflect.getPrototypeOf()` |
|`setPrototypeOf`          | `Object.setPrototypeOf()`    | `Reflect.setPrototypeOf()` |
|`isExtensible`            | `Object.isExtensible()`      | `Reflect.isExtensible()` |
|`preventExtensions`       | `Object.preventExtensions()` | `Reflect.preventExtensions()` |
|`getOwnPropertyDescriptor`| `Object.getOwnPropertyDescriptor()` | `Reflect.getOwnPropertyDescriptor()` |
|`defineProperty`          | `Object.defineProperty()`    | `Reflect.defineProperty` |
|`ownKeys`                 | `Object.keys`, `Object.getOwnPropertyNames()`, `Object.getOwnPropertySymbols()` | `Reflect.ownKeys()` |
|`apply`                   | Виклик функції               | `Reflect.apply()` |
|`construct`               | Виклик функції з `new`       | `Reflect.construct()` |

Кожне перехоплення перезаписує деяку вбудовану поведінку JavaScript–об’єктів, дозволяючи вам переривати та змінювати цю поведінку. Якщо ж вам все ж потрібна вбудована поведінка, тоді ви може використовувати відповідний метод API рефлексії. Взаємодія проксі та API рефлексії стає зрозумілою коли почати створювати проксі, тож краще поринути у приклади.

I> Початкова специфікація ECMAScript 6 має додаткове перехоплення `enumerate`, що розроблене для зміни того як `for-in` та `Object.keys()` перелічує властивості об’єкта. Однак, перехоплення `enumerate` видалено у ECMAScript 7 (ECMAScript 2016) через складності, що виникли при його імплементації. Перехоплення `enumerate` більше немає у будь–якому оточенні JavaScript, тому у цій главі про нього йти мова не буде.

## Створення простого проксі

Коли ви використовуєте конструктор `Proxy` для створення проксі, ви маєте передати два аргументи: ціль та обробник. *Обробник (handler)* — це об’єкт, що визначає одне або більше перехоплень. Проксі використовує поведінку за замовчування для всіх операцій, окрім тих, для яких визначені перехоплення. Для створення простого демонстраційного проксі ви можете використати обробник без жодного перехоплення:

```js
let target = {};

let proxy = new Proxy(target, {});

proxy.name = "proxy";
console.log(proxy.name);        // "proxy"
console.log(target.name);       // "proxy"

target.name = "target";
console.log(proxy.name);        // "target"
console.log(target.name);       // "target"
```

У цьому прикладі `proxy` передає всі операції відразу до `target`. Коли властивості `proxy.name` присвоюється `"proxy"`, `name` створюється у `target`. Саме проксі не зберігає цю властивість, воно просто передає операцію до `target`. Таким чином, значення `proxy.name` та `target.name` є однаковими, оскільки вони обоє посилаються на `target.name`. Це також означає, що встановлення нового значення властивості `target.name` призведе до того, що `proxy.name` відобразить цю зміну. Звісно, проксі без перехоплень не дуже цікаві, то що ж станеться, якщо визначити перехоплення?

## Валідація властивостей з використанням перехоплення `set`

Припустимо ви хочете створити об’єкт, властивості якого мусять бути числами. Це означає, що кожна нова властивість, яка додається до цього об’єкту, повинна проходити валідацію і якщо її значенням не є число, має кидатись помилка. Щоб зробити це, ви можете визначити перехоплення `set`, що перезаписує поведінку за замовчуванням для встановлення значення. Перехоплення `set` отримує чотири аргументи:

1. `trapTarget` — об’єкт, який отримає властивості (ціль проксі);
1. `key` — ключ властивості (рядок або символ) для запису;
1. `value` — значення, яке записується у властивість;
1. `receiver` — об’єкт до якого застосовується операція (зазвичай проксі).

`Reflect.set()` це метод рефлексії, який відповідає перехопленню `set`, і є поведінкою за замовчуванням для цієї операції. Метод `Reflect.set()` приймає ті ж чотири аргументи, що і перехоплення проксі `set`, і тому його дуже зручно використовувати всередині цього перехоплення. Перехоплення має повернути `true`, якщо властивість встановлено, або `false`, якщо ні. (Метод `Reflect.set()` повертає правильне значення на основі того, чи операція завершилась успішно.)

Для валідації значень властивостей, ви, скоріш за все, будете використовувати перехоплення `set` та перевіряти значення `value`, яке передається. Ось приклад:

```js
let target = {
    name: "target"
};

let proxy = new Proxy(target, {
    set(trapTarget, key, value, receiver) {

        // ігноруємо властивості, які вже існують, оскільки не впливатиме на них
        if (!trapTarget.hasOwnProperty(key)) {
            if (isNaN(value)) {
                throw new TypeError("Property must be a number.");
            }
        }

        // додаємо властивість
        return Reflect.set(trapTarget, key, value, receiver);
    }
});

// додаємо нову властивість
proxy.count = 1;
console.log(proxy.count);       // 1
console.log(target.count);      // 1

// ви можете можете присвоїти значення name, бо воно вже існує на цілі
proxy.name = "proxy";
console.log(proxy.name);        // "proxy"
console.log(target.name);       // "proxy"

// кине помилку
proxy.anotherName = "proxy";
```

Цей код визначає перехоплення проксі, яке перевіряє значення будь–якої нової властивості, що додається до `target`. Коли виконується `proxy.count = 1`, викликається перехоплення `set`. Значення `trapTarget` дорівнює `target`, `key` рівне `"count"`, `value` містить `1`, а `receiver` (не використовується у цьому прикладі) буде `proxy`. `target` не має на собі властивості `count`, тому проксі валідує значення `value` шляхом передачі його в `isNaN()`. Якщо результат `NaN`, тоді значення властивості не є числовим і кидається помилка. Оскільки цей код встановлює у `count` значення `1`, проксі викликає `Reflect.set()` з тими ж чотирма аргументами, що були передані у перехоплення для встановлення нової властивості.

Коли `proxy.name` присвоюється рядок, операція відбувається успішно. Оскільки `target` вже має властивість `name`, ця властивість пропускається при валідації через виклик методу `trapTarget.hasOwnProperty()`. Він перевіряє чи попередньо встановлені нечислові значення властивості залишаються підтримуваними.

Однак, коли `proxy.anotherName` присвоюється рядок, кидається помилка. Ціль не має властивості `anotherName`, тому її значення потребує перевірки. Під час валідації кидається помилка, бо `"proxy"` не є числовим значенням.

Перехоплення проксі `set` дає вам можливість перервати запис властивостей, а щоб перервати читання властивостей можна скористатись перехопленням проксі `get`.

## Валідація форми об’єкта з допомогою перехоплення `get`

Одним з цікавих та часом заплутаних аспектів JavaScript є те, що читання неіснуючих властивостей не кидає помилки. Замість цього, значення `undefined` використовується в якості значення властивості, як у цьому прикладі:

```js
let target = {};

console.log(target.name);       // undefined
```

У більшості інших мов, спроба зчитати `target.name` кине помилку, тому що такої властивості не існує. А от JavaScript просто використовує `undefined` в якості значення властивості `target.name`. Якщо ви коли–небудь працювали зі значною кодовою базою, ви, можливо, бачили, як така поведінка може спричинити значні проблеми, особливо якщо допустити помилку у імені властивості. Проксі можуть врятувати вас від цієї проблеми завдяки можливості перевіряти форму об’єкта.

*Форма об’єкта (object shape)* — це колекція властивостей та методів, що доступні на об’єкті. Рушії JavaScript використовують форми об’єктів для оптимізації коду, зазвичай шляхом створення, що відповідають цим об’єктами. Якщо ви можете зробити висновок, що об’єкт завжди матиме одні і ті ж властивості та методи (цю поведінку ми можете досягнути через методи `Object.preventExtensions()`, `Object.seal()` або `Object.freeze()`), скоріш за все вам знадобиться кидати помилки при спробі доступу до неіснуючих властивостей. Проксі роблять валідацію форми об’єктів простішою.

Оскільки валідація властивостей має відбуватись лише при читанні властивостей, ви можете використовувати перехоплення `get`. Перехоплення `get` викликається тоді, коли властивість читається, навіть якщо цієї властивості не існує на об’єкті. Воно приймає такі три аргументи:

1. `trapTarget` — об’єкт, з якого читається властивість (ціль проксі);
1. `key` — ключ властивості, що читається (рядок або символ);
1. `receiver` — об’єкт, до якого застосовується операція (зазвичай проксі).

Ці аргументи такі ж як і ті, що отримує перехоплення `set`, з однією важливою відмінністю: немає аргументу `value`, тому що перехоплення `get` не здійснює запис властивостей. Метод `Reflect.get()` приймає такі ж три аргументи, як і перехоплення `get`, та повертає значення властивості за замовчуванням.

Ви можете використовувати перехоплення `get` разом з `Reflect.get()`, щоб кидати помилку, коли ціль не має такої властивості, ось так:

```js
let proxy = new Proxy({}, {
        get(trapTarget, key, receiver) {
            if (!(key in receiver)) {
                throw new TypeError("Property " + key + " doesn't exist.");
            }

            return Reflect.get(trapTarget, key, receiver);
        }
    });

// можна додавати нові властивості
proxy.name = "proxy";
console.log(proxy.name);            // "proxy"

// якщо властивості не існує, кидатиметься помилка
console.log(proxy.nme);             // throws error
```

У цьому прикладі, перехоплення `get` перериває операцію читання властивості. Оператор `in` використовується для визначення чи властивість вже існує на `receiver`. `receiver` використовується з `in` замість `trapTarget` у випадку, коли `receiver` є проксі з перехопленням `has`, про яке я розповім у наступному розділі. Використання `trapTarget`, у цьому випадку, обходило б перехоплення `has` та імовірно дало б хибний результат. Помилка кидається тоді, коли властивості не існує, в інших випадках спрацьовує поведінка за замовчуванням.

Цей код без проблем дозволяє додавати нові властивості, як от `proxy.name`, писати та читати з них. Останній рядок містить помилку: `proxy.nme` має бути `proxy.name`. Це кидає помилку, тому що властивості `nme` не існує.

## Приховування існування властивості через перехоплення `has`

Оператор `in` визначає чи властивість існує у даного об’єкта і повертає `true`, якщо є власна властивість або властивість прототипа, що відповідає такому імені або символу. Наприклад:

```js
let target = {
    value: 42;
}

console.log("value" in target);     // true
console.log("toString" in target);  // true
```

Як `value` так і `toString` існують у `object`, тому в обох випадках оператор `in` повертає `true`. Властивість `value` є власною властивістю, тоді як `toString` є властивість прототипа (успадкована від `Object`). Проксі дозволяють вам перервати цю операцію та повернути інше значення для `in` через перехопленням `has`.

Перехоплення `has` викликається щоразу, коли використовується оператор `in`. При виклику, у перехоплення `has` передається два аргументи:

1. `trapTarget` — властивість об’єкта з якої відбувається читання (ціль проксі);
1. `key` — ключ властивості (рядок або символ) для перевірки.

Метод `Reflect.has()` приймає ті самі аргументи та повертає відповідь за замовчуванням для оператора `in`. Використання перехоплення `has` та `Reflect.has()` дозволяє вам змінити поведінку `in` для деяких властивостей і в той же час для інших використовувати поведінку за замовчуванням. Наприклад, припустимо ви хочете приховати властивість `value`. Ви можете зробити це ось так:

```js
let target = {
    name: "target",
    value: 42
};

let proxy = new Proxy(target, {
    has(trapTarget, key) {

        if (key === "value") {
            return false;
        } else {
            return Reflect.has(trapTarget, key);
        }
    }
});


console.log("value" in proxy);      // false
console.log("name" in proxy);       // true
console.log("toString" in proxy);   // true
```

Перехоплення `has` для `proxy` перевіряє чи `key` є `"value"` та повертає `false` якщо це так. В іншому випадку, використовується поведінка за замовчування через виклик методу `Reflect.has()`. В результаті, оператор `in` повертає `false` для властивості `value`, не дивлячись на те, що `value` насправді існує на цілі. Для інших властивостей, `name` та `toString`, при використанні оператора `in` повертається `true`.

## Перешкоджання видаленню властивості з допомогою перехоплення `deleteProperty`

Оператор `delete` видаляє властивість з об’єкта та повертає `true`, якщо операція відбулась успішно, та `false`, якщо ні. У строгому режимі `delete` кидає помилку при спробі видалення властивості, яку не можна змінювати; у нестрогому режимі `delete` просто повертає `false`. Ось приклад:

```js
let target = {
    name: "target",
    value: 42
};

Object.defineProperty(target, "name", { configurable: false });

console.log("value" in target);     // true

let result1 = delete target.value;
console.log(result1);               // true

console.log("value" in target);     // false

// Зверніть увагу: ці рядки кинуть помилку у строгому режимі
let result2 = delete target.name;
console.log(result2);               // false

console.log("name" in target);      // true
```

Властивість `value` видаляється з допомогою оператора `delete` і в результаті оператор `in` повертає `false` у третьому виклику `console.log()`. Властивість `name`, яку не можна змінювати, не можна видалити, тому оператор `delete` просто повертає `false` (якщо цей код запустити у строгому режимі, замість цього кинеться помилка). Ви можете змінити таку поведінку через використання перехоплення `deleteProperty` на проксі.

Перехоплення `deleteProperty` викликається щоразу, коли оператор `delete` застосовується до властивості об’єкта. Перехоплення приймає два аргументи:

1. `trapTarget` - об’єкт, з якого треба видалити властивість (ціль проксі)
1. `key` - ключ властивості (рядок або символ), який видаляється

Метод `Reflect.deleteProperty()` надає імплементацію за замовчуванням для перехоплення `deleteProperty` та приймає такі ж два аргументи. Ви можете комбінувати `Reflect.deleteProperty()` та перехоплення `deleteProperty` для того, щоб змінити поведінку оператора `delete`. Наприклад, ви можете убезпечити властивість `value` від видалення:

```js
let target = {
    name: "target",
    value: 42
};

let proxy = new Proxy(target, {
    deleteProperty(trapTarget, key) {

        if (key === "value") {
            return false;
        } else {
            return Reflect.deleteProperty(trapTarget, key);
        }
    }
});

// Спроба видалення proxy.value

console.log("value" in proxy);      // true

let result1 = delete proxy.value;
console.log(result1);               // false

console.log("value" in proxy);      // true

// Спроба видалення proxy.name

console.log("name" in proxy);       // true

let result2 = delete proxy.name;
console.log(result2);               // true

console.log("name" in proxy);       // false
```

Цей код дуже схожий на приклад з перехопленням `has` тим, що перехоплення `deleteProperty` перевіряє, чи `key` рівне `"value"` та повертає `false`, якщо це так. В інших випадках буде використовуватись поведінка за замовчуванням з допомогою виклику методу `Reflect.deleteProperty()`. Властивість `value` не можна видалити через `proxy`, тому що операція перехоплюється, проте властивість `name` видаляється так, як і очікується. Такий підхід особливо корисний, коли ви хочете захистити властивості від видалення без кидання помилки у строгому режимі.

## Перехоплення проксі прототипів

Глава 4 розповідала про метод `Object.setPrototypeOf()`, що додається ECMAScript 6 в якості доповнення до методу `Object.getPrototypeOf()` з ECMAScript 5. Проксі дозволяють вам перервати виконання обох методів через перехоплення `setPrototypeOf` та `getPrototypeOf`. У обох випадках, методи `Object` викликають відповідні перехоплення на проксі, дозволяючи вам змінити поведінку цих методів.

Оскільки є два перехоплення, що стосуються проксі прототипів, є сукупність методів, що стосуються кожного з них. Перехоплення `setPrototypeOf` отримує три аргументи:

1. `trapTarget` — об’єкт, для якого встановлюється прототип (ціль проксі);
1. `proto` — об’єкт, що використовуватиметься у якості прототипу.

Такі ж аргументи передаються у методи `Object.setPrototypeOf()` та `Reflect.setPrototypeOf()`. В той же час, перехоплення `getPrototypeOf` отримує лише аргумент `trapTarget`, який є аргументом, що передається у методи `Object.getPrototypeOf()` та `Reflect.getPrototypeOf()`.

### Як працюють перехоплення проксі прототипів

Ці перехоплення мають кілька обмежень. По–перше, перехоплення `getPrototypeOf` мусить повертати об’єкт або `null`, а всі інші значення в якості результату призведуть до помилки оточення. Значення, що повертається, перевіряється для певності, що `Object.getPrototypeOf()` поверне очікуване значення. Так само, перехоплення `setPrototypeOf` мусить повертати `false`, якщо операція завершилась безуспішно. Коли `setPrototypeOf` повертає `false`, тоді `Object.setPrototypeOf()` кидає помилку. Коли `setPrototypeOf` поверне будь–яке інше значення замість `false`, тоді `Object.setPrototypeOf()` вважає, що операція завершилась успішно.

Наступні приклади завжди повертають `null` і тим самим приховують прототип проксі та не дозволяють змінювати прототип:

```js
let target = {};
let proxy = new Proxy(target, {
    getPrototypeOf(trapTarget) {
        return null;
    },
    setPrototypeOf(trapTarget, proto) {
        return false;
    }
});

let targetProto = Object.getPrototypeOf(target);
let proxyProto = Object.getPrototypeOf(proxy);

console.log(targetProto === Object.prototype);      // true
console.log(proxyProto === Object.prototype);       // false
console.log(proxyProto);                            // null

// виконується успішно
Object.setPrototypeOf(target, {});

// кидає помилку
Object.setPrototypeOf(proxy, {});
```

Цей код підкреслює відмінність між поведінкою `target` та `proxy`. Якщо `Object.getPrototypeOf()` повертає значення для `target`, то для `proxy` він повертає `null`, тому що викликається перехоплення `getPrototypeOf`. Так само, `Object.setPrototypeOf()` успішно використовується з `target`, проте кидає помилку при використанні з `proxy` через перехоплення `setPrototypeOf`.

Якщо ви хочете використовувати поведінку за замовчуванням для цих двох перехоплень, ви можете скористатись відповідними методами з `Reflect`. Для прикладу, цей код реалізує поведінку за замовчуванням для перехоплень `getPrototypeOf` та `setPrototypeOf`:

```js
let target = {};
let proxy = new Proxy(target, {
    getPrototypeOf(trapTarget) {
        return Reflect.getPrototypeOf(trapTarget);
    },
    setPrototypeOf(trapTarget, proto) {
        return Reflect.setPrototypeOf(trapTarget, proto);
    }
});

let targetProto = Object.getPrototypeOf(target);
let proxyProto = Object.getPrototypeOf(proxy);

console.log(targetProto === Object.prototype);      // true
console.log(proxyProto === Object.prototype);       // true

// виконується успішно
Object.setPrototypeOf(target, {});

// кидає помилку
Object.setPrototypeOf(proxy, {});
```

У цьому прикладі ви можете використовувати і `target`, і `proxy` незалежно і отримати один і той же результат завдяки тому, що перехоплення `getPrototypeOf` та `setPrototypeOf` просто передають керування імплементації за замовчуванням. Важливо те, що цей приклад використовує методи `Reflect.getPrototypeOf()` та `Reflect.setPrototypeOf()` замість тих самих методів у `Object` через деякі важливі відмінності.

### Чому дві множини методів?

Складним для розуміння аспектом у `Reflect.getPrototypeOf()` та `Reflect.setPrototypeOf()` є те, що вони виглядають підозріло схоже на методи `Object.getPrototypeOf()` та `Object.setPrototypeOf()`. Хоча ці дві множини методів і виконують схожі операції, між ними є кілька суттєвих відмінностей.

Для початку, `Object.getPrototypeOf()` та `Object.setPrototypeOf()` є високорівневими операціями, що початково розроблені для того, щоб їх використовували розробники. Методи `Reflect.getPrototypeOf()` та `Reflect.setPrototypeOf()` є низькорівневими операціями, що дають розробникам доступ до операцій `[[GetPrototypeOf]]` та `[[SetPrototypeOf]]`, які раніше були виключно внутрішніми. Метод `Reflect.getPrototypeOf()` є обгорткою для внутрішньої операції `[[GetPrototypeOf]]` (з валідацією вхідних параметрів). Методи `Reflect.setPrototypeOf()` та `[[SetPrototypeOf]]` пов’язані так само. Відповідні методи у `Object` також викликають `[[GetPrototypeOf]]` та `[[SetPrototypeOf]]`, проте перед цим виконують декілька кроків та перевіряють значення, що повертається, аби визначити як їм поводитись.

Метод `Reflect.getPrototypeOf()` кидає помилку, якщо аргумент не є об’єктом, тоді як `Object.getPrototypeOf()` спершу приводить значення до об’єкту перед виконанням операції. Якщо ви передасте число у кожен з методів, ви отримаєте різний результат:

```js
let result1 = Object.getPrototypeOf(1);
console.log(result1 === Number.prototype);  // true

// кидає помилку
Reflect.getPrototypeOf(1);
```

Метод `Object.getPrototypeOf()` дозволяє отримати прототип числа для `1` тому, що спершу він приводить це значення у об’єкт `Number`, а потім повертає `Number.prototype`. Метод `Reflect.getPrototypeOf()` не приводить значення, і оскільки `1` не об’єкт, він кидає помилку.

Метод `Reflect.setPrototypeOf()` також має кілька відмінностей від метода `Object.setPrototypeOf()`. По–перше, `Reflect.setPrototypeOf()` повертає булеве значення, яке вказує на те, чи операція завершилась успішно. Значення `true` повертається у випадку успішного завершення, а `false` у випадку негараздів. Якщо `Object.setPrototypeOf()` завершується безуспішно, він кидає помилку.

У першому прикладі з «Як працюють перехоплення проксі прототипів» показано, що коли перехоплення проксі `setPrototypeOf` повертає `false`, це спричинено тим, що `Object.setPrototypeOf()` кидає помилку. Метод `Object.setPrototypeOf()` повертає перший аргумент в якості свого значення і тому не дуже підходить для реалізації поведінки за замовчуванням для перехоплення `setPrototypeOf`. Такий код демонструє ці відмінності:

```js
let target1 = {};
let result1 = Object.setPrototypeOf(target1, {});
console.log(result1 === target1);                   // true

let target2 = {};
let result2 = Reflect.setPrototypeOf(target2, {});
console.log(result2 === target2);                   // false
console.log(result2);                               // true
```

У цьому прикладі, `Object.setPrototypeOf()` повертає `target1` в якості свого значення, проте `Reflect.setPrototypeOf()` повертає `true`. Ця маленька відмінність є дуже важливою. Ви ще побачите схожі методи `Object` та `Reflect`, що схожі на перший погляд, проте пам’ятайте, що всередині перехоплень для проксі краще використовувати методи з `Reflect`.

I> Обидві множини методів викликають перехоплення `getPrototypeOf` та `setPrototypeOf` при виклику для проксі.

## Перехоплення розширення об’єктів

ECMAScript 5 додав можливість розширювати об’єкти через методи `Object.preventExtensions()` та `Object.isExtensible()`, а ECMAScript 6 дозволяє проксі переривати виклики цих методів для відповідних об’єктів через перехоплення `preventExtensions` та `isExtensible`. Обидва перехоплення отримують єдиний аргумент `trapTarget`, що є об’єктом, для якого викликається метод. Перехоплення `isExtensible` має повернути булеве значення, що вказує на те, чи об’єкт можна розширити, а перехоплення `preventExtensions` повертає булеве значення, яке вказує на успішність операції.

Є також методи `Reflect.preventExtensions()` та `Reflect.isExtensible()`, які реалізують поведінку за замовчуванням. Обидва повертають булеві значення, тож їх можна використовувати у відповідних перехопленнях.

### Два простих приклади

Щоб побачити перехоплення розширень у дії, розгляньте наступний код, який реалізує поведінку за замовчуванням для перехоплень `isExtensible` та `preventExtensions`:

```js
let target = {};
let proxy = new Proxy(target, {
    isExtensible(trapTarget) {
        return Reflect.isExtensible(trapTarget);
    },
    preventExtensions(trapTarget) {
        return Reflect.preventExtensions(trapTarget);
    }
});


console.log(Object.isExtensible(target));       // true
console.log(Object.isExtensible(proxy));        // true

Object.preventExtensions(proxy);

console.log(Object.isExtensible(target));       // false
console.log(Object.isExtensible(proxy));        // false
```

Цей приклад показує, що і `Object.preventExtensions()`, і `Object.isExtensible()` правильно передаються від `proxy` до `target`. Ви можете, звісно, змінити цю поведінку. Наприклад, якщо ви хочете заборонити успішне застосування `Object.preventExtensions()` до ваших проксі, ви можете повернути `false` з перехоплення `preventExtensions`:

```js
let target = {};
let proxy = new Proxy(target, {
    isExtensible(trapTarget) {
        return Reflect.isExtensible(trapTarget);
    },
    preventExtensions(trapTarget) {
        return false
    }
});


console.log(Object.isExtensible(target));       // true
console.log(Object.isExtensible(proxy));        // true

Object.preventExtensions(proxy);

console.log(Object.isExtensible(target));       // true
console.log(Object.isExtensible(proxy));        // true
```

Тут виклик `Object.preventExtensions(proxy)` успішно ігнорується завдяки тому, що перехоплення `preventExtensions` повертає `false`. Операція не переходить до залежного `target`, тому `Object.isExtensible()` повертає `true`.

### Дублювання методів розширення

Ви могли помітити, що знову є очевидне дублювання методів `Object` та `Reflect`. У цьому випадку вони більш схожі, аніж відмінні. Методи `Object.isExtensible()` та `Reflect.isExtensible()` схожі у всьому, окрім поведінки при спробі передати значення, яке не є об’єктом. У цьому випадку, `Object.isExtensible()` завжди повертає `false`, а `Reflect.isExtensible()` кидає помилку. Ось приклад такої поведінки:

```js
let result1 = Object.isExtensible(2);
console.log(result1);                       // false

// кидає помилку
let result2 = Reflect.isExtensible(2);
```

Це обмеження схоже на відмінність між методами `Object.getPrototypeOf()` та `Reflect.getPrototypeOf()`, оскільки методи з низькорівневим функціоналом мають більш строгу перевірку на помилки, ніж їхні високорівневі аналоги.

Методи `Object.preventExtensions()` та `Reflect.preventExtensions()` також дуже схожі. Метод `Object.preventExtensions()` завжди повертає значення, яке передається йому в якості аргументу, навіть якщо це значення не є об’єктом. З іншого боку, метод `Reflect.preventExtensions()` кидає помилку, якщо аргумент не є об’єктом. Якщо ж аргумент є об’єктом, тоді `Reflect.preventExtensions()` повертає `true`, коли операція завершується успішно, і `false`, якщо ні. Наприклад:

```js
let result1 = Object.preventExtensions(2);
console.log(result1);                               // 2

let target = {};
let result2 = Reflect.preventExtensions(target);
console.log(result2);                               // true

// throws error
let result3 = Reflect.preventExtensions(2);
```

Тут `Object.preventExtensions()` повертає значення `2`, не дивлячись на те, що `2` не є об’єктом. Метод `Reflect.preventExtensions()` повертає `true`, коли у нього передається об’єкт, та кидає помилку, коли передається `2`.

## Перехоплення дескрипторів властивостей

Одним з найбільш важливих нововведень ECMAScript 5 була можливість встановлювати атрибути властивостей через метод `Object.defineProperty()`. У попередніх версіях JavaScript не було можливості задати властивість–аксесор, зробити властивість доступною лише для читання або зробити її неперелічуваною. Все це можливо з методом `Object.defineProperty()`, Ви можете дістати ці атрибути через метод `Object.getOwnPropertyDescriptor()`.

Проксі дозволяють вам переривати виклики `Object.defineProperty()` та `Object.getOwnPropertyDescriptor()` через перехоплення `defineProperty` та `getOwnPropertyDescriptor` відповідно. Перехоплення `defineProperty` отримує такі аргументи:

1. `trapTarget` — об’єкт, якому встановлюються властивості (ціль проксі);
1. `key` — рядок або символ, що буде ключем властивості;
1. `descriptor` — об’єкт–дескриптор для цієї властивості.

Перехоплення `defineProperty` повинне повертати `true`, якщо операція завершилась успішно, і `false`, якщо ні. Перехоплення `getOwnPropertyDescriptor` отримує лише `trapTarget` і `key`, а в якості результату має повернути дескриптор. Відповідні методи `Reflect.defineProperty()` та `Reflect.getOwnPropertyDescriptor()` приймають ті самі аргументи, що й їхні аналоги–перехоплення в проксі. Ось приклад, який просто реалізує поведінку за замовчуванням для кожного перехоплення:

```js
let proxy = new Proxy({}, {
    defineProperty(trapTarget, key, descriptor) {
        return Reflect.defineProperty(trapTarget, key, descriptor);
    },
    getOwnPropertyDescriptor(trapTarget, key) {
        return Reflect.getOwnPropertyDescriptor(trapTarget, key);
    }
});


Object.defineProperty(proxy, "name", {
    value: "proxy"
});

console.log(proxy.name);            // "proxy"

let descriptor = Object.getOwnPropertyDescriptor(proxy, "name");

console.log(descriptor.value);      // "proxy"
```

Цей код встановлює проксі властивість `"name"` через метод `Object.defineProperty()`. Потім методом `Object.getOwnPropertyDescriptor()` отримується дескриптор цієї властивості.

### Блокування Object.defineProperty()

Перехоплення `defineProperty` має повертати булеве значення, яке вказуватиме на успішність операції. Коли повертається `true`, тоді `Object.defineProperty()` завершується як зазвичай, якщо повертається `false`, тоді `Object.defineProperty()` кидає помилку. Ви можете використовувати цей функціонал, щоб заборонити методу `Object.defineProperty()` встановлювати певний тип властивостей. Наприклад, якщо ви не хочете, щоб об’єкту можна було встановлювати символьні властивості, ви можете перевірити чи є ключ рядком і повернути `false` якщо ні, ось так:

```js
let proxy = new Proxy({}, {
    defineProperty(trapTarget, key, descriptor) {

        if (typeof key === "symbol") {
            return false;
        }

        return Reflect.defineProperty(trapTarget, key, descriptor);
    }
});


Object.defineProperty(proxy, "name", {
    value: "proxy"
});

console.log(proxy.name);                    // "proxy"

let nameSymbol = Symbol("name");

// throws error
Object.defineProperty(proxy, nameSymbol, {
    value: "proxy"
});
```

Перехоплення проксі `defineProperty` повертає `false`, коли `key` є символом, а для інших випадків використовує поведінку за замовчуванням. Коли викликається `Object.defineProperty()` з `"name"` в якості ключа, метод завершується успішно, тому що ключ є рядком. Коли `Object.defineProperty()` викликається з `nameSymbol`, він кидає помилку, тому що перехоплення `defineProperty` повертає `false`.

I> Ви також можете завершити `Object.defineProperty()` без помилки, просто повернувши `true`, але не викликавши метод `Reflect.defineProperty()`. Це не призведе до помилки, але й не встановить властивості.

### Обмеження об’єктів–дескрипторів

Для забезпечення правильної поведінки при використанні методів `Object.defineProperty()` та `Object.getOwnPropertyDescriptor()` об’єкти–дескриптори, які передаються у перехоплення `defineProperty`, нормалізуються. Об’єкти, які повертаються з перехоплення `getOwnPropertyDescriptor`, завжди перевіряються з цією ж метою.

Не важливо, який об’єкт передається у якості третього аргументу в метод `Object.defineProperty()`, об’єкт–дескриптор, який передається у перехоплення `defineProperty`, завжди матиме лише властивості `enumerable`, `configurable`, `value`, `writable`, `get` та `set`. Наприклад:

```js
let proxy = new Proxy({}, {
    defineProperty(trapTarget, key, descriptor) {
        console.log(descriptor.value);              // "proxy"
        console.log(descriptor.name);               // undefined

        return Reflect.defineProperty(trapTarget, key, descriptor);
    }
});


Object.defineProperty(proxy, "name", {
    value: "proxy",
    name: "custom"
});
```

Тут `Object.defineProperty()` викликається з об’єктом, який має нестандартну властивість `name` в якості третього аргументу. Коли спрацьовує перехоплення `defineProperty`, об’єкт `descriptor` не має властивості `name`, проте все ще має властивість `value`. Це тому, що `descriptor` не є посиланням на об’єкт, який передається у метод `Object.defineProperty()`, натомість він є новим об’єктом, що містить лише дозволені властивості. Метод `Reflect.defineProperty()` також ігнорує всі нестандартні властивості дескриптора.

Перехоплення `getOwnPropertyDescriptor` має дещо інше обмеження: значення, яке воно повертає, має бути `null`, `undefined` або об’єктом. Якщо повертається об’єкт, то він мусить містити виключно `enumerable`, `configurable`, `value`, `writable`, `get` та `set` в якості власних властивостей. Якщо ви повернете об’єкт з власними властивостями, які є забороненими, кинеться помилка. Ось код, що це демонструє:

```js
let proxy = new Proxy({}, {
    getOwnPropertyDescriptor(trapTarget, key) {
        return {
            name: "proxy";
        };
    }
});

// кидає помилку
let descriptor = Object.getOwnPropertyDescriptor(proxy, "name");
```

Властивість `name` є забороненою для дескриптора, тож при виклику `Object.getOwnPropertyDescriptor()`, значення, яке повертає `getOwnPropertyDescriptor` призводить до помилки. Таке обмеження забезпечує правильну структуру значення, яке повертає `Object.getOwnPropertyDescriptor()`, незалежно від використання проксі.

### Дублювання дескрипторних методів

І знову ECMAScript 6 має плутанину зі схожими методами, адже методи `Object.defineProperty()` та `Object.getOwnPropertyDescriptor()`, здається, роблять те саме, що й методи `Reflect.defineProperty()` та `Reflect.getOwnPropertyDescriptor()`, відповідно. Як і методи, про які вже йшла мова у цій главі, вони також мають незначні, проте важливі відмінності.

#### Методи defineProperty()

Методи `Object.defineProperty()` та `Reflect.defineProperty()` є однаковими, за виключенням значень, які вони повертають. Метод `Object.defineProperty()` повертає перший аргумент, тоді як `Reflect.defineProperty()` повертає `true`, якщо операція завершилась успішно, і `false` якщо ні. Наприклад:


```js
let target = {};

let result1 = Object.defineProperty(target, "name", { value: "target "});

console.log(target === result1);        // true

let result2 = Reflect.defineProperty(target, "name", { value: "reflect" });

console.log(result2);                   // true
```

Коли `Object.defineProperty()` викликається для `target`, він повертає `target`. Коли `Reflect.defineProperty()` викликається для `target`, він повертає `true`, вказуючи на те, що операція завершилась успішно. Оскільки перехоплення `defineProperty` для проксі повинне повертати булеве значення, якщо необхідно реалізувати поведінку за замовчуванням, краще використовувати `Reflect.defineProperty()`.

#### Методи getOwnPropertyDescriptor()

Метод `Object.getOwnPropertyDescriptor()` приводить свій перший аргумент до об’єкта, якщо передати у нього примітивне значення, і тоді продовжує виконувати операцію. З іншого боку, метод `Reflect.getOwnPropertyDescriptor()` кидає помилку, якщо перший аргумент є примітивним значенням. Ось приклад, який демонструє відмінність:

```js
let descriptor1 = Object.getOwnPropertyDescriptor(2, "name");
console.log(descriptor1);       // undefined

// throws an error
let descriptor2 = Reflect.getOwnPropertyDescriptor(2, "name");
```

Метод `Object.getOwnPropertyDescriptor()` повертає `undefined`, тому що він приводить `2` до об’єкта, а такий об’єкт не має властивості `name`. Така поведінка є стандартною для цього методу, коли переданий об’єкт не має властивості `name`. Однак, коли викликається `Reflect.getOwnPropertyDescriptor()`, негайно кидається помилка, тому що цей метод не приймає примітивні значення в якості першого аргументу.

## Перехоплення `ownKeys`

Перехоплення проксі `ownKeys` перериває внутрішній метод `[[OwnPropertyKeys]]` та дозволяє вам перезаписувати цю поведінку шляхом повернення масиву значень. Цей масив використовується у чотирьох методах: `Object.keys()`, `Object.getOwnPropertyNames()`, `Object.getOwnPropertySymbols()` та `Object.assign()`. (Метод `Object.assign()` використовує цей масив для визначення властивостей, які треба копіювати.)

Поведінка за замовчування для перехоплення `ownKeys` реалізується методом `Reflect.ownKeys()` та повертає масив всіх власних ключів властивостей, включаючи рядки та символи. Методи `Object.getOwnProperyNames()` та `Object.keys()` відфільтровують символи з масиву та повертають результат, тоді як `Object.getOwnPropertySymbols()` відфільтровує рядки з масиву і повертає результат. Метод `Object.assign()` використовує масив з рядками та символами.

Перехоплення `ownKeys` отримує єдиний аргумент, ціль (target), та мусить повернути масив або об’єкт з цифровими числовими ключами, інакше кинеться помилка. Ви можете використовувати перехоплення `ownKeys`, наприклад, для того, щоб відфільтрувати певні властивості, які не мають використовуватись в `Object.keys()`, `Object.getOwnPropertyNames()`, `Object.getOwnPropertySymbols()` або `Object.assign()`. Припустимо, ви не хочете включати властивості, що починаються з нижнього підкреслення (underscore), загальноприйнятого позначення у JavaScript, що поле є приватним. Ви можете використовувати перехоплення `ownKeys`, щоб відфільтрувати такі ключі ось так:

```js
let proxy = new Proxy({}, {
    ownKeys(trapTarget) {
        return Reflect.ownKeys(trapTarget).filter(key => {
            return typeof key !== "string" || key[0] !== "_";
        });
    }
});

let nameSymbol = Symbol("name");

proxy.name = "proxy";
proxy._name = "private";
proxy[nameSymbol] = "symbol";

let names = Object.getOwnPropertyNames(proxy),
    keys = Object.keys(proxy);
    symbols = Object.getOwnPropertySymbols(proxy);

console.log(names.length);      // 1
console.log(names[0]);          // "proxy"

console.log(keys.length);      // 1
console.log(keys[0]);          // "proxy"

console.log(symbols.length);    // 1
console.log(symbols[0]);        // "Symbol(name)"
```

Цей приклад використовує перехоплення `ownKeys`, яке спершу викликає `Reflect.ownKeys()`, щоб отримати список ключів за замовчуванням. Потім метод `filter()` відфільтровує ключі, що є рядками і починаються з символу нижнього підкреслення. Тоді до об’єкту `proxy` додаються три властивості: `name`, `_name` та `nameSymbol`. Коли `Object.getOwnPropertyNames()` та `Object.keys()` викликається для `proxy`, повертається лише властивості `name`. Схожим чином, лише `nameSymbol` повертається при виклику `Object.getOwnPropertySymbols()` на `proxy`. Властивість `_name` не з’являється в жодному з результатів через те, що вона відфільтрована.

Перехоплення `ownKeys` дозволяє вам змінити ключі, що повертаються, з допомогою невеликої кількості операцій, проте воно не впливає на більш поширені операції, такі як `for-of` та метод `Object.keys()`. Їх не можна змінити з допомогою проксі.

I> Перехоплення `ownKeys` також можна застосувати до циклу `for-in`, який викликає перехоплення для визначення ключів, які мають використовуватись всередині циклу.

## Проксі функцій з перехопленнями `apply` та `construct`

З усіх перехоплень проксі, лише `apply` та `construct` вимагають, щоб ціль проксі була функцією. Згадаємо з Глави 3, що функції мають два внутрішні методи `[[Call]]` та `[[Construct]]`, які викликаються коли функція викликається з та без оператора `new`, відповідно. Перехоплення `apply` та `construct` відповідають цим методам та дозволяють їх перевизначити. Коли функція викликається без `new`, перехоплення `apply` приймає, а `Reflect.apply()` очікує на такі аргументи:

1. `trapTarget` — функція, яка виконується (ціль проксі);
1. `thisArg` — значення `this` всередині функції протягом виклику;
1. `argumentsList` — масив аргументів, які передаються у функцію.

Перехоплення `construct`, яке викликається, коли функція виконується з використанням `new`, отримує такі аргументи:

1. `trapTarget` — функція, яка виконується (ціль проксі);
1. `argumentsList` — масив аргументів, які передаються у функцію.

Метод `Reflect.construct()` також приймає ці два аргументи і має необов’язковий третій аргумент `newTarget`. Якщо його передати, аргумент `newTarget` визначає значення `new.target` всередині функції.

Разом, перехоплення `apply` та `construct` повністю контролюють поведінку будь–якої цілі проксі функції. Щоб зімітувати поведінку функцій за замовчуванням, ви можете зробити ось так:

```js
let target = function() { return 42 },
    proxy = new Proxy(target, {
        apply: function(trapTarget, thisArg, argumentList) {
            return Reflect.apply(trapTarget, thisArg, argumentList);
        },
        construct: function(trapTarget, argumentList) {
            return Reflect.construct(trapTarget, argumentList);
        }
    });

// проксі з функцією в якості цілі виглядає як функція
console.log(typeof proxy);                  // "function"

console.log(proxy());                       // 42

var instance = new proxy();
console.log(instance instanceof proxy);     // true
console.log(instance instanceof target);    // true
```

Цей приклад має функцію, що повертає число 42. Проксі для цієї функції використовує перехоплення `apply` та `construct`, щоб делегувати поведінку до методів `Reflect.apply()` та `Reflect.construct()`, відповідно. Кінцевим результатом є те, що проксі–функція працює точно так, як функція–ціль, включаючи самовизначення, як функція при використанні `typeof`. Проксі викликається без `new` та повертає 42, а потім викликається з `new` для створення об’єкту `instance`. Об’єкт `instance` розглядається як екземпляр `proxy` і `target`, тому що `instanceof` використовує ланцюжок прототипів для визначення цієї інформації. Пошук по ланцюжку прототипів не залежить від цього проксі, ось чому для рушія JavaScript це виглядає так, наче `proxy` та `target` мають той самий прототип.

### Валідація параметрів функції

Перехоплення `apply` та `construct` відкривають багато можливостей для зміни того, як функції виконуються. Для прикладу, припустимо ви хочете перевірити, що всі аргументи мають певний тип. Ви можете перевірити це у перехопленні `apply`:

```js
// додаємо разом всі аргументи
function sum(...values) {
    return values.reduce((previous, current) => previous + current, 0);
}

let sumProxy = new Proxy(sum, {
        apply: function(trapTarget, thisArg, argumentList) {

            argumentList.forEach((arg) => {
                if (typeof arg !== "number") {
                    throw new TypeError("All arguments must be numbers.");
                }
            });

            return Reflect.apply(trapTarget, thisArg, argumentList);
        },
        construct: function(trapTarget, argumentList) {
            throw new TypeError("This function can't be called with new.");
        }
    });

console.log(sumProxy(1, 2, 3, 4));          // 10

// кидає помилку
console.log(sumProxy(1, "2", 3, 4));

// також кидає помилку
let result = new sumProxy();
```

Цей приклад використовує перехоплення `apply` для певності, що всі аргументи є числами. Функція `sum()` додає всі аргументи, що були передані. Якщо передати щось замість числа, функція спробує виконати цю операцію, що призведе до неочікуваного результату. Огорнувши `sum()` всередину проксі `sumProxy()`, цей код може перервати виклики функції та перевірити, що кожен аргумент є числом, перед тим як дозволити виконатись цьому виклику. Про всяк випадок, код також використовує перехоплення `construct` для перевірки того, що функцію не можна викликати з `new`.

Ви можете також зробити протилежне, забезпечити, щоб функція викликалась лише з `new` та перевіряти, щоб її аргументи були числами:

```js
function Numbers(...values) {
    this.values = values;
}

let NumbersProxy = new Proxy(Numbers, {

        apply: function(trapTarget, thisArg, argumentList) {
            throw new TypeError("This function must be called with new.");
        },

        construct: function(trapTarget, argumentList) {
            argumentList.forEach((arg) => {
                if (typeof arg !== "number") {
                    throw new TypeError("All arguments must be numbers.");
                }
            });

            return Reflect.construct(trapTarget, argumentList);
        }
    });

let instance = new NumbersProxy(1, 2, 3, 4);
console.log(instance.values);               // [1,2,3,4]

// кидає помилку
NumbersProxy(1, 2, 3, 4);
```

Тут, перехоплення `apply` кидає помилку, бо перехоплення `construct` використовує метод `Reflect.construct()` для перевірки вводу та повернення нового екземпляра. Звичайно ви можете зробити те саме і без проксі, використовуючи `new.target`, замість цього.

### Виклик конструктора без new

Глава 3 вводила метавластивість `new.target`. Нагадаємо, що `new.target` є посиланням на функцію, до якої застосовується `new`. Це означає, що ви можете сказати, чи функція викликана з використанням `new`, чи без нього, перевіривши значення `new.target` ось так:

```js
function Numbers(...values) {

    if (typeof new.target === "undefined") {
        throw new TypeError("This function must be called with new.");
    }

    this.values = values;
}

let instance = new Numbers(1, 2, 3, 4);
console.log(instance.values);               // [1,2,3,4]

// throws error
Numbers(1, 2, 3, 4);
```

Цей приклад кидає помилку, коли `Numbers` викликається без використання `new`, що є тим самим, що і в прикладі з розділу «Валідація параметрів функції», проте без використання проксі. Написання такого коду набагато простіше за використання проксі, тому краще надавати перевагу саме йому, якщо вам потрібно просто перешкоджати виклику функції без `new`. Проте часом ви не можете контролювати функцію, поведінка якої змінено. В такому випадку, використання проксі має зміст.

Припустимо, функція `Numbers` визначена у коді, який ви не можете змінювати. Ви знаєте, що код використовує `new.target`, і хочете уникнути цієї перевірки при виклику функції. Поведінка при використанні `new` вже визначена, тому ви можете використати лише перехоплення `apply`:

```js
function Numbers(...values) {

    if (typeof new.target === "undefined") {
        throw new TypeError("This function must be called with new.");
    }

    this.values = values;
}


let NumbersProxy = new Proxy(Numbers, {
        apply: function(trapTarget, thisArg, argumentsList) {
            return Reflect.construct(trapTarget, argumentsList);
        }
    });


let instance = NumbersProxy(1, 2, 3, 4);
console.log(instance.values);               // [1,2,3,4]
```

Функція `NumbersProxy` дозволяє вам викликати `Numbers` без використання `new` і мати таку поведінку, як і при використанні `new`. Щоб зробити це, перехоплення `apply` викликає `Reflect.construct()` з аргументами, які передаються у `apply`. `new.target` всередині `Numbers` дорівнює самому `Numbers` і тому не кидається помилка. Це простий приклад модифікації `new.target`, проте ви можете зробити і більш складні.

### Перевизначення конструкторів абстрактних базових класів

Ви можете зробити ще один крок і передати третій аргумент у `Reflect.construct()`, який буде значенням `new.target`. Це корисно, коли функція перевіряє `new.target` проти відомого значення, як от при створенні конструктора абстрактного базового класу (про який йшла мова у Главі 9). У конструкторі абстрактного базового класу, очікується, що `new.target` буде чимось відмінним від самого конструктора класу, як у цьому прикладі:

```js
class AbstractNumbers {

    constructor(...values) {
        if (new.target === AbstractNumbers) {
            throw new TypeError("This function must be inherited from.");
        }

        this.values = values;
    }
}

class Numbers extends AbstractNumbers {}

let instance = new Numbers(1, 2, 3, 4);
console.log(instance.values);           // [1,2,3,4]

// кидає помилку
new AbstractNumbers(1, 2, 3, 4);
```

Коли викликається `new AbstractNumbers()`, `new.target` дорівнює `AbstractNumbers`, тому кидається помилка. Виклик `new Numbers()` продовжує працювати, бо `new.target` дорівнює `Numbers`. Ви можете обійти це обмеження простим присвоєнням `new.target` з проксі:

```js
class AbstractNumbers {

    constructor(...values) {
        if (new.target === AbstractNumbers) {
            throw new TypeError("This function must be inherited from.");
        }

        this.values = values;
    }
}

let AbstractNumbersProxy = new Proxy(AbstractNumbers, {
        construct: function(trapTarget, argumentList) {
            return Reflect.construct(trapTarget, argumentList, function() {});
        }
    });


let instance = new AbstractNumbersProxy(1, 2, 3, 4);
console.log(instance.values);               // [1,2,3,4]
```

`AbstractNumbersProxy` використовує перехоплення `construct`, щоб перервати виклик методу `new AbstractNumbersProxy()`. Тоді, метод `Reflect.construct()` викликається з аргументами з перехоплення та порожньою функцією в якості третього аргументу. Ця порожня функція використовується в якості значення для `new.target` всередині конструктора. Оскільки `new.target` не дорівнює `AbstractNumbers`, помилка не кидається і конструктор виконується до кінця.

### Конструктори класів, які можна викликати

Глава 9 розповідала, що конструктори класів завжди повинні викликатись з `new`. Це стається завдяки внутрішньому методу `[[Call]]` для конструкторів класів, який кидає помилку. Проте проксі можуть перервати виклик методу `[[Call]]`, тобто, з використанням проксі, ви можете легко створити конструктори класів, які можна викликати. Наприклад, якщо ви хочете, щоб конструктор класу працював без використання `new`, ви можете використати перехоплення `apply` для створення нового екземпляра. Ось код, який це ілюструє:

```js
class Person {
    constructor(name) {
        this.name = name;
    }
}

let PersonProxy = new Proxy(Person, {
        apply: function(trapTarget, thisArg, argumentList) {
            return new trapTarget(...argumentList);
        }
    });


let me = PersonProxy("Nicholas");
console.log(me.name);                   // "Nicholas"
console.log(me instanceof Person);      // true
console.log(me instanceof PersonProxy); // true
```

Об’єкт `PersonProxy` є проксі конструктора класу `Person`. Конструкторами класів є прості функції, тому вони поводяться як функції при використанні у проксі. Перехоплення `apply` перевизначає поведінку за замовчуванням та повертає екземпляр `trapTarget`, який рівний `Person`. (Я використовую `trapTarget` у цьому прикладі, щоб продемонструвати, що ви не потребуєте вручну вказувати клас.) `argumentList` передається у `trapTarget` з використанням оператора розкладу, щоб передати кожен аргумент окремо. Виклик `PersonProxy()` без використання `new` повертає екземпляр `Person`. Якщо ви спробуєте викликати `Person()` без `new`, конструктор досі кидатиме помилку. Створення конструкторів класів, які можна викликати, можливе лише з допомогою проксі.

## Відміна проксі

Зазвичай, проксі не можна відв’язати від цілі після його створення. Всі попередні приклади у цій главі використовували проксі, які не можна відмінити. Проте можуть бути ситуації, коли ви захочете відмінити проксі, яке не може більше використовуватись. Це може бути найбільш корисним, коли ви захочете передавати об’єкт через API з метою безпеки або підтримувати здатність обмежувати доступність до певного функціоналу в певний момент часу.

Ви можете створити проксі, які можна відмінити, через метод `Proxy.revocable()`, який приймає ті ж аргументи, що і конструктор `Proxy`: об’єкт–ціль та проксі–обробник. Повертати він має об’єкт з такими властивостями:

1. `proxy` — об’єкт проксі, яке можна відмінити;
1. `revoke` — функція, яку можна викликати, щоб відмінити проксі.

Після виклику функції `revoke()`, більше не можна застосувати жодної операції через `proxy`. Будь–яка спроба взаємодії з об’єктом проксі, яка запускає перехоплення, призведе до помилки. Наприклад:

```js
let target = {
    name: "target"
};

let { proxy, revoke } = Proxy.revocable(target, {});

console.log(proxy.name);        // "target"

revoke();

// кидає помилку
console.log(proxy.name);
```

Цей приклад створює проксі, яке можна відмінити. Він використовує деструктурування, щоб присвоїти змінним `proxy` та `revoke` властивості з такими ж іменами з об’єкту, який повертається методом `Proxy.revocable()`. Після цього, об’єкт `proxy` можна використовувати так само, як і об’єкт проксі, яке не можна відмінити, тому `proxy.name` повертає `"target"`, яке передається через `target.name`. Однак, як тільки викликається функція `revoke()`, `proxy` перестає функціонувати. Спроба звернутись до `proxy.name` призведе до помилки, як і будь–яка інша операція, яка викликає перехоплення на `proxy`.

## Вирішення проблеми масивів

На початку цієї глави я пояснював, як розробники не могли імітувати точну поведінку масивів у JavaScript аж до ECMAScript 6. Проксі та АРІ рефлексії дозволяє створювати об’єкти, що поводяться так само, як і вбудований тип `Array`, коли йому додаються або видаляють властивості. Щоб освіжити пам’ять, ось приклад, що показує яку поведінку допомагають зімітувати проксі:

```js
let colors = ["red", "green", "blue"];

console.log(colors.length);         // 3

colors[3] = "black";

console.log(colors.length);         // 4
console.log(colors[3]);             // "black"

colors.length = 2;

console.log(colors.length);         // 2
console.log(colors[3]);             // undefined
console.log(colors[2]);             // undefined
console.log(colors[1]);             // "green"
```

У цьому прикладі є дві важливі особливості, на які слід звернути увагу:

1. властивість `length` збільшується до 4, коли `colors[3]` присвоюється значення;
1. останні два елементи масиву видаляються, коли властивості `length` встановлюється 2.

Щоб точно відтворити роботу вбудованих масивів потрібно реалізувати лише ці дві особливості. Наступні кілька розділів описуватимуть те, як можна зробити об’єкти, які точно імітуватимуть їх.

### Видалення індексів у масиві

Пам’ятайте, що присвоєння цілочисельного ключа властивості є спеціальним випадком для масивів, оскільки це трактується не так, як для випадку з нечисловими ключами. Специфікація ECMAScript 6 дає такі вказівки щодо того, як визначити, чи ключ властивості є індексом масиву:

> Рядкова властивість `P` є індексом масиву тоді, і тільки тоді, коли `ToString(ToUint32(P))` дорівнює `P`, а `ToUint32(P)` не дорівнює 2^32^-1.

Така операція може бути реалізована на JavaScript ось так:

```js
function toUint32(value) {
    return Math.floor(Math.abs(Number(value))) % Math.pow(2, 32);
}

function isArrayIndex(key) {
    let numericKey = toUint32(key);
    return String(numericKey) == key && numericKey < (Math.pow(2, 32) - 1);
}
```

Функція `toUint32()` конвертує дане значення у беззнакове 32-бітне ціле число через алгоритм, описаний у специфікації. Функція `isArrayIndex()` спершу конвертує ключ у 32–бітний код, а тоді застосовує порівняння, щоб визначити, чи ключ є індексом масиву, чи ні. З цими функціями–утилітами, ви можете почати імплементувати об’єкт, який буде імітувати вбудовані масиви.

### Збільшення довжини при додаванні нових елементів

Ви могли помітити, що обидві особливості, які я описав раніше, базуються на присвоєння властивості. Це означає, що насправді вам потрібно використовувати лише перехоплення проксі `set`, щоб забезпечити таку поведінку. Для початку, ось приклад, який імплементує першу особливість: збільшення властивості `length`, коли використовується індекс масиву, більший за `length - 1`:

```js
function toUint32(value) {
    return Math.floor(Math.abs(Number(value))) % Math.pow(2, 32);
}

function isArrayIndex(key) {
    let numericKey = toUint32(key);
    return String(numericKey) == key && numericKey < (Math.pow(2, 32) - 1);
}

function createMyArray(length=0) {
    return new Proxy({ length }, {
        set(trapTarget, key, value) {

            let currentLength = Reflect.get(trapTarget, "length");

            // особливий випадок
            if (isArrayIndex(key)) {
                let numericKey = Number(key);

                if (numericKey >= currentLength) {
                    Reflect.set(trapTarget, "length", numericKey + 1);
                }
            }

            // завжди робити це, незалежно від типу ключа
            return Reflect.set(trapTarget, key, value);
        }
    });
}

let colors = createMyArray(3);
console.log(colors.length);         // 3

colors[0] = "red";
colors[1] = "green";
colors[2] = "blue";

console.log(colors.length);         // 3

colors[3] = "black";

console.log(colors.length);         // 4
console.log(colors[3]);             // "black"
```

Цей приклад використовує перехоплення проксі `set`, щоб перервати встановлення індексу масиву. Якщо ключ є індексом масиву, тоді він конвертується у число, тому що ключі завжди передаються як рядки. Далі, якщо це числове значення є більшим або дорівнює поточній властивості `length`, тоді властивість `length` збільшується на один за числове значення (встановлення елементу у позицію 3 означає, що `length` мусить бути 4). Після цього, використовується поведінка встановлення властивості за замовчуванням через `Reflect.set()`, оскільки ви хочете присвоїти властивості вказане значення.

Початковий користувацький масив створюється через виклик `createMyArray()` з `length` рівним 3 та значеннями для цих трьох елементів, які додаються відразу після цього. Властивість `length` точно рівна 3, доки значення `"black"` не присвоюється у позицію 3. Тоді `length` встановлюється значення 4.

З готовою першою особливістю, час перейти до другої.

### Видалення елементів та зменшення довжини

Перша особливість, яку треба імітувати, використовується лише тоді, коли індекс масиву більший або дорівнює властивості `length`. Інша особливість є протилежною і видаляє елементи масиву, коли властивості `length` встановлюється менше значення, ніж вона містила до цього. Це включає в себе не лише зміну властивості `length`, але й видалення всіх елементів, які могли б там існувати. Наприклад, якщо масиву з `length`, що рівна 4, встановити `length`, рівну 2, то елементи з позицій 2 та 3 видаляться. Ви можете отримати це всередині перехоплення `set`, поруч з першою особливістю. Ось попередній приклад з оновленим методом `createMyArray`:

```js
function toUint32(value) {
    return Math.floor(Math.abs(Number(value))) % Math.pow(2, 32);
}

function isArrayIndex(key) {
    let numericKey = toUint32(key);
    return String(numericKey) == key && numericKey < (Math.pow(2, 32) - 1);
}

function createMyArray(length=0) {
    return new Proxy({ length }, {
        set(trapTarget, key, value) {

            let currentLength = Reflect.get(trapTarget, "length");

            // особливий випадок
            if (isArrayIndex(key)) {
                let numericKey = Number(key);

                if (numericKey >= currentLength) {
                    Reflect.set(trapTarget, "length", numericKey + 1);
                }
            } else if (key === "length") {

                if (value < currentLength) {
                    for (let index = currentLength - 1; index >= value; index--) {
                        Reflect.deleteProperty(trapTarget, index);
                    }
                }

            }

            // завжди робити це, незалежно від типу
            return Reflect.set(trapTarget, key, value);
        }
    });
}

let colors = createMyArray(3);
console.log(colors.length);         // 3

colors[0] = "red";
colors[1] = "green";
colors[2] = "blue";
colors[3] = "black";

console.log(colors.length);         // 4

colors.length = 2;

console.log(colors.length);         // 2
console.log(colors[3]);             // undefined
console.log(colors[2]);             // undefined
console.log(colors[1]);             // "green"
console.log(colors[0]);             // "red"
```

Проксі перехоплення `set` у цьому коді перевіряє, чи `key` є `"length"` для того, щоб правильно підлаштувати решту об’єкта. Коли це стається, спершу, через `Reflect.get()`, дістається поточна довжина і порівнюється з новим значенням. Якщо нове значення є меншим за поточну довжину, тоді цикл `for` видаляє всі властивості цілі, які більше не мають бути доступними. Цикл `for` проходить від поточної довжини масиву (`currentLength`) і видаляє всі властивості, поки не досягає нової довжини масиву (`value`).

Цей приклад додає чотири кольори у `colors`, а тоді встановлює властивості `length` значення 2. Він просто видаляє елементи з позицій 2 та 3, тому тепер вони повертають `undefined` при спробі звернутись до них. Властивості `length` правильно встановлюється значення 2, а елементи з позицій 0 та 1 залишаються доступними.

Тепер, коли обидві особливості імплементовані, ви можете легко створити об’єкт, який імітує поведінку вбудованих масивів. Проте не бажано робити це з допомогою функції, краще інкапсулювати цю поведінку всередині класу, тому наступним кроком буде імплементація цієї функціональності у вигляді класу.

### Імплементація класу MyArray

Найпростіший спосіб створити клас, що використовуватиме проксі — це визначити звичайний клас та повернути проксі з його конструктора. Таким чином, об’єктом, який повернеться після ініціалізації класу, буде проксі, а не екземпляр класу. (Екземпляром є значення `this` всередині конструктора.) Екземпляр стає ціллю проксі, а проксі повертається так, наче воно є екземпляром. Екземпляр є повністю приватним і у вас не буде безпосереднього доступу до нього, хоча ви й матимете можливість звертатись до нього за допомогою проксі.

Ось простий приклад повернення проксі з конструктора класу:

```js
class Thing {
    constructor() {
        return new Proxy(this, {});
    }
}

let myThing = new Thing();
console.log(myThing instanceof Thing);      // true
```

У цьому прикладі, клас `Thing` повертає проксі зі свого конструктора. Ціллю проксі є `this`, а проксі повертається з конструктора. Це означає, що `myThing` насправді є проксі, не зважаючи на те, що воно створене викликом конструктора `Thing`. Оскільки проксі передають свою поведінку до своїх цілей, `myThing` вважається екземпляром `Thing`, роблячи проксі повністю прозорим для тих, хто використовує клас `Thing`.

Пам’ятаючи це, створення власного класу масивів з використанням проксі є відносно простим. Код майже такий самий, як і код з розділу «Видалення елементів та зменшення довжини». Використовується такий же код для проксі, проте цього разу він всередині конструктора класу. Ось повний приклад:

```js
function toUint32(value) {
    return Math.floor(Math.abs(Number(value))) % Math.pow(2, 32);
}

function isArrayIndex(key) {
    let numericKey = toUint32(key);
    return String(numericKey) == key && numericKey < (Math.pow(2, 32) - 1);
}

class MyArray {
    constructor(length=0) {
        this.length = length;

        return new Proxy(this, {
            set(trapTarget, key, value) {

                let currentLength = Reflect.get(trapTarget, "length");

                // особливий випадок
                if (isArrayIndex(key)) {
                    let numericKey = Number(key);

                    if (numericKey >= currentLength) {
                        Reflect.set(trapTarget, "length", numericKey + 1);
                    }
                } else if (key === "length") {

                    if (value < currentLength) {
                        for (let index = currentLength - 1; index >= value; index--) {
                            Reflect.deleteProperty(trapTarget, index);
                        }
                    }

                }

                // завжди робити це, незалежно від типу
                return Reflect.set(trapTarget, key, value);
            }
        });

    }
}


let colors = new MyArray(3);
console.log(colors instanceof MyArray);     // true

console.log(colors.length);         // 3

colors[0] = "red";
colors[1] = "green";
colors[2] = "blue";
colors[3] = "black";

console.log(colors.length);         // 4

colors.length = 2;

console.log(colors.length);         // 2
console.log(colors[3]);             // undefined
console.log(colors[2]);             // undefined
console.log(colors[1]);             // "green"
console.log(colors[0]);             // "red"
```

Цей код створює клас `MyArray`, який повертає проксі з свого конструктора. Властивість `length` додається в конструкторі (ініціалізується зі значення, яке передається або зі значення 0 за замовчуванням), а тоді створюється і повертає проксі. Через це змінна `colors` виглядає як екземпляр `MyArray` та імплементує обидві ключові особливості масивів.

Повернути проксі з конструктора класу легко, проте це означає, що нове проксі створюється для кожного екземпляру. Однак, існує спосіб поширити одне проксі на всі екземпляри: ви можете використати проксі в якості прототипу.

## Використання проксі в якості прототипу

Проксі можна використати в якості прототипу, проте зробити це дещо складніше, ніж у попередніх прикладах з цієї глави. Коли проксі є прототипом, перехоплення проксі б викликались лише тоді, коли операції за замовчуванням продовжувалися б до прототипу, що обмежувало б можливості проксі в якості прототипу. Розгляньте приклад:

```js
let target = {};
let newTarget = Object.create(new Proxy(target, {

    // ніколи не викличеться
    defineProperty(trapTarget, name, descriptor) {

        // спричинило б помилку при виклику
        return false;
    }
}));

Object.defineProperty(newTarget, "name", {
    value: "newTarget"
});

console.log(newTarget.name);                    // "newTarget"
console.log(newTarget.hasOwnProperty("name"));  // true
```

Об’єкт `newTarget` створюється з проксі в якості прототипу. Роблячи `target` ціллю проксі, робить `target` прототипом `newTarget`, тому що проксі є прозорим. Тепер проксі перехоплення викликатиметься, якщо операція над `newTarget`, якщо операція передаватиметься, щоб відбуватись над `target`.

Метод `Object.defineProperty()` викликається для `newTarget`, щоб створити нову властивість `name`. Визначення властивості об’єкта не є операцією, що зазвичай передається до прототипа об’єкта, тому перехоплення `defineProperty`для проксі не викликатиметься, а властивість `name` додасться до `newTarget` як власна властивість.

Проксі дещо обмежені при використанні їх в якості прототипів, проте є кілька перехоплень, які є досі корисними.

### Використання перехоплення `get` на прототипі

Коли внутрішній метод `[[Get]]` викликається для читання властивості, операція спершу шукає за власними властивостями. Якщо власна властивість з даним ім’ям не знаходиться, тоді операція продовжується для прототипа і шукає властивість там. Цей процес продовжується до тих пір, доки не залишиться прототипів для перевірки.

Завдяки цьому процесу, якщо ви встановите перехоплення `get`, перехоплення буде викликатись на прототипі щоразу, коли власної властивості з заданим ім’ям не існуватиме. Ви можете використовувати перехоплення `get`, щоб запобігти неочікуваній поведінці при зверненні до властивостей, які можуть не існувати. Просто створіть об’єкт, який кидатиме помилку щоразу, коли ви спробуєте звернутись до властивості, якої не існує:

```js
let target = {};
let thing = Object.create(new Proxy(target, {
    get(trapTarget, key, receiver) {
        throw new ReferenceError(`${key} doesn't exist`);
    }
}));

thing.name = "thing";

console.log(thing.name);        // "thing"

// кидає помилку
let unknown = thing.unknown;
```

У цьому коді об’єкт `thing` створюється з проксі в якості прототипу. Перехоплення `get` кидає помилку, коли виклик показує, що переданого ключа не існує на об’єкті `thing`. Коли `thing.name` зчитується, операція ніколи не викликає перехоплення `get` для прототипа, бо властивість існує у `thing`. Перехоплення `get` викликається лише при зверненні до властивості `thing.unknown`, якої не існує.

Коли виконується останній рядок, `unknown` не є власною властивістю `thing`, тому операція продовжується на прототипі. Тоді перехоплення `get` кидає помилку. Така поведінка може бути дуже корисною у JavaScript, в якому невідомі властивості просто повертають `undefined` замість того, щоб кинути помилку (як це стається у інших мовах).

Важливо зрозуміти, що у цьому прикладі `trapTarget` та `receiver` є різними об’єктами. Коли проксі використовується у якості прототипу, `trapTarget` є прототипом самого об’єкта, тоді як `receiver` є екземпляром цього об’єкта. У цьому випадку, це означає, `trapTarget` є однаковим з `target`, а `receiver` є однаковим з `thing`. Це дозволяє мати доступ і до початкової цілі проксі, і до об’єкту, до якого має застосуватись операція.

### Використання перехоплення `set` на прототипі

Внутрішня властивість `[[Set]]` також перевіряє власні властивості і, за потреби, продовжує шукати їх на прототипі. Коли ви присвоюєте значення властивості об’єкта, значення присвоюється власній властивості з таким же ім’ям, якщо вона вже існує. Якщо ж властивості з таким ім’ям не існує, тоді операція застосовується до прототипу. Підступним моментом є те, що хоча й оператор присвоєння спускається до прототипу, присвоєння значення цій властивості за замовчуванням створить цю властивість екземпляру (не прототипу), незалежно від того, чи властивість з таким ім’ям існує на прототипі.

Щоб краще зрозуміти, коли перехоплення `set` викликається на прототипі, а коли ні, розгляньте такий приклад, який демонструє поведінку за замовчуванням:

```js
let target = {};
let thing = Object.create(new Proxy(target, {
    set(trapTarget, key, value, receiver) {
        return Reflect.set(trapTarget, key, value, receiver);
    }
}));

console.log(thing.hasOwnProperty("name"));      // false

// запускає перехоплення проксі `set`
thing.name = "thing";

console.log(thing.name);                        // "thing"
console.log(thing.hasOwnProperty("name"));      // true

// не запускає перехоплення проксі `set`
thing.name = "boo";

console.log(thing.name);                        // "boo"
```

У цьому випадку `target` створюється без власних властивостей. Об’єкт `thing` має проксі в якості прототипу, яке визначає перехоплення `set`, яке ловить створення усіх нових властивостей. Коли `thing.name` присвоюється значення `"thing"`, перехоплення `set` викликається через те, що `thing` не має власної властивості `name`. Всередині перехоплення `set`, `trapTarget` дорівнює `target`, а `receiver` дорівнює `thing`. Операція, зрештою, створює нову властивість у `thing`, і, на щастя, `Reflect.set()` реалізує цю поведінку за замовчуванням для вас, якщо передати `receiver` в якості четвертого аргументу.

Як тільки властивість `name` створюється у `thing`, встановлення `thing.name` іншого значення більше не викликатиме перехоплення проксі `set`. Після цього, `name` є власною властивістю, тому операція `[[Set]]` ніколи не спускатиметься до прототипа.

### Використання перехоплення `has` на прототипі

Згадаємо, що перехоплення `has` перериває використання оператора `in` до об’єкта. Оператор `in` шукає спершу власну властивість об’єкту з даним ім’ям. Якщо власної властивості з таким ім’ям не існує, тоді операція застосовується до прототипа. Якщо немає власної властивості прототипа, тоді пошук спускається по ланцюжкові прототипів, доки не знайде таку власну властивість, або поки не залишиться прототипів для пошуку.

Тому перехоплення `has` викликається, коли пошук досягає об’єкту проксі у ланцюжкові прототипів. При використанні проксі у якості прототипа, це стається лише тоді, коли не існує власної властивості з даним ім’ям. Наприклад:

```js
let target = {};
let thing = Object.create(new Proxy(target, {
    has(trapTarget, key) {
        return Reflect.has(trapTarget, key);
    }
}));

// запускає перехоплення проксі `has`
console.log("name" in thing);                   // false

thing.name = "thing";

// не запускає перехоплення проксі `has`
console.log("name" in thing);                   // true
```

Цей код створює перехоплення проксі `has` на прототипі `thing`. Перехоплення `has` не отримує об’єкта `receiver`, на відміну від перехоплень `get` та `set`, тому що пошук по прототипі автоматично відбувається при використанні оператора `in`. Замість цього, перехоплення `has` повинне виконуватись лише для `trapTarget`, яке дорівнює `target`. Спершу оператор `in` використовується у цьому прикладі, перехоплення `has` викликається тому, що `thing` не має власної властивості `name`. Коли `thing.name` дається значення і оператор `in` застосовується знову, перехоплення `has` не викликається, бо операція зупиняється, знайшовши власну властивість `name` у `thing`.

До цього приклади з прототипами були пов’язані зі створенням об’єктів через метод `Object.create()`. Проте, якщо ви хочете створити клас, що має проксі у якості прототипа, процес дещо ускладнюється.

### Проксі в якості прототипів у класах

Класи не можна модифікувати таким чином, щоб використовувати проксі у якості прототипів, тому що їхня властивість `prototype` недоступна для запису. Однак, ви можете скористатись обхідним шляхом, щоб створити клас, який матиме проксі в якості прототипа, через використання наслідування. Для початку, вам потрібно створити оголошення типу у стилі ECMAScript 5 через функцію–конструктор. Потім ви можете встановити йому проксі у якості прототипа. Ось приклад:

```js
function NoSuchProperty() {
    // порожньо
}

NoSuchProperty.prototype = new Proxy({}, {
    get(trapTarget, key, receiver) {
        throw new ReferenceError(`${key} doesn't exist`);
    }
});

let thing = new NoSuchProperty();

// кидає помилку через перехоплення проксі `get`
let result = thing.name;
```

Функція `NoSuchProperty` являє собою базу, від якої будуть успадковуватись класи. Ця функція не має жодних обмежень щодо `prototype`, тому ви можете перезаписати його на проксі. Перехоплення `get` використовується для того, щоб кинути помилку, коли властивості не існує. Об’єкт `thing` створюється як екземпляр `NoSuchProperty` і кидає помилку при спробі звернення до неіснуючої властивості `name`.

Наступним кроком є створення класу, який наслідується від `NoSuchProperty`. Ви можете просто використати синтаксис `extends`, про який йшла мова у Главі 9, щоб ввести проксі у ланцюжок прототипів класу, ось так:

```js
function NoSuchProperty() {
    // порожньо
}

NoSuchProperty.prototype = new Proxy({}, {
    get(trapTarget, key, receiver) {
        throw new ReferenceError(`${key} doesn't exist`);
    }
});

class Square extends NoSuchProperty {
    constructor(length, width) {
        super();
        this.length = length;
        this.width = width;
    }
}

let shape = new Square(2, 6);

let area1 = shape.length * shape.width;
console.log(area1);                         // 12

// кидає помилку, бо "wdth" не існує
let area2 = shape.length * shape.wdth;
```

Клас `Square` наслідує від `NoSuchProperty`, тому проксі з’являється у ланцюжкові прототипів класу `Square`. Об’єкт `shape` створюється як новий екземпляр `Square` і має дві власні властивості: `length` та `width`. Читання значень з цих властивостей відбувається успішно, тому що перехоплення проксі `get` ніколи не викликається. Лише при зверненні до властивості `shape`, якої не існує (`shape.wdth`, очевидно помилкова) призводить до того, що спрацьовує перехоплення проксі `get` і кидається помилка.

Це доводить те, що у ланцюжкові прототипів `shape` є проксі, проте це може бути недостатньо очевидно, що проксі не є прямим прототипом `shape`. Фактично, проксі перебуває у ланцюжку прототипів на кілька кроків вище від `shape`. Ви можете побачити це більш наочно, трішки змінивши приклад:

```js
function NoSuchProperty() {
    // порожньо
}

// зберігаємо посилання на проксі, яке буде прототипом
let proxy = new Proxy({}, {
    get(trapTarget, key, receiver) {
        throw new ReferenceError(`${key} doesn't exist`);
    }
});

NoSuchProperty.prototype = proxy;

class Square extends NoSuchProperty {
    constructor(length, width) {
        super();
        this.length = length;
        this.width = width;
    }
}

let shape = new Square(2, 6);

let shapeProto = Object.getPrototypeOf(shape);

console.log(shapeProto === proxy);                  // false

let secondLevelProto = Object.getPrototypeOf(shapeProto);

console.log(secondLevelProto === proxy);            // true
```

Така версія цього коду зберігає проксі у змінну з ім’ям `proxy`, тому його легко буде ідентифікувати згодом. Прототипом `shape` є `Shape.prototype`, який не є проксі. Проте прототипом `Shape.prototype` є проксі, що було успадковане від `NoSuchProperty`.

Наслідування додає додатковий крок у ланцюжкові прототипів, і це важливо, тому що операціям, які можуть залежати від викликів перехоплення `get` на `proxy`, потрібно проходити додатковий крок, щоб дістатись до нього. Якщо ж `Shape.prototype` матиме таку властивість, то це буде перешкоджати виклику перехоплення проксі `get`, як у цьому прикладі:

```js
function NoSuchProperty() {
    // порожньо
}

NoSuchProperty.prototype = new Proxy({}, {
    get(trapTarget, key, receiver) {
        throw new ReferenceError(`${key} doesn't exist`);
    }
});

class Square extends NoSuchProperty {
    constructor(length, width) {
        super();
        this.length = length;
        this.width = width;
    }

    getArea() {
        return this.length * this.width;
    }
}

let shape = new Square(2, 6);

let area1 = shape.length * shape.width;
console.log(area1);                         // 12

let area2 = shape.getArea();
console.log(area2);                         // 12

// кидає помилку, бо "wdth" не існує
let area3 = shape.length * shape.wdth;
```

Тут, клас `Square` має метод `getArea()`. Метод `getArea()` автоматично додається до `Square.prototype`, тому коли викликається `shape.getArea()`, пошук методу `getArea()` починається з екземпляра `shape` і переходить до його прототипа. Оскільки `getArea()` знаходиться на прототипі, пошук припиняється і проксі ніколи не викличеться. Насправді це саме та поведінка, яка вам потрібна у цьому випадку, адже ви не хочете, щоб при виклику `getArea()` кидались помилки.

Хоча створення класу з проксі в ланцюжкові прототипів і потребує деякого додаткового коду, це може виправдати зусилля, якщо ви потребуєте такої функціональності.

## Підсумок

До ECMAScript 6 певні об’єкти (як от масиви) мали нестандартну поведінку, яку не могли відтворити розробники. Проксі змінюють це. Вони дають вам можливість визначати власну нестандартну поведінку для ряду низькорівневих операцій у JavaScript, тому ви можете відтворити поведінку всіх вбудованих об’єктів JavaScript через перехоплення проксі. Ці перехоплення викликаються за кулісами, коли відбуваються різні операції, як от використання оператора `in`.

ECMAScript 6 також вводить API рефлексії, щоб дозволити розробникам імплементувати поведінку за замовчуванням для перехоплень проксі. Кожне перехоплення проксі має відповідний метод на об’єкті `Reflect` — ще одному розширенні ECMAScript 6. Використовуючи комбінації перехоплень проксі та методів API рефлексії, можна створити різну поведінку для певних операцій, в залежності від певних умов.

Проксі, які можна відмінювати, є спеціальними проксі, які можна просто відключити з допомогою функції `revoke()`. Функція `revoke()` відміняє всю функціональність проксі, тому будь–яка спроба взаємодіяти з властивостями проксі призведе до помилки після виклику `revoke()`. Проксі, які можна відміняти, є важливими для безпеки додатків, в яких сторонні розробники можуть потребувати доступу до певних об’єктів протягом певного проміжку часу.

Безпосереднє використання проксі є дуже потужним, проте ви також можете використовувати проксі в якості прототипу іншого об’єкта. У цьому випадку ви зменшуєте кількість перехоплень проксі, які ви можете використовувати ефективно. Лише перехоплення проксі `get`, `set` та `has` будуть викликатись на проксі, якщо використовувати його в якості прототипа, зменшуючи поле можливих застосувань.
