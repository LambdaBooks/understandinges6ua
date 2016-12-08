# Інкапсуляція Коду за допомогою Модулiв

Підхід "роздавати все" в JavaScript для завантаження коду є одним з найбільш схильних до помилок і заплутаних аспектів мови. Інші мови використовують такі поняття, як пакети, щоб визначити область видимості, але до ECMAScript 6, все оголошене в кожному файлі JavaScript мало один загальну глобальну область видимості. Як веб-додатки стали більш складними і почали використовувати ще більше коду JavaScript, такий почав викликати проблеми, такі як конфлікти імен та проблем безпеки. Одна з цілей ECMAScript 6 було вирішити проблему з областями видимості і навести порядок до додатків JavaScript. І тут за справу беруться модулі.

## Що таке модулі?

*Модулі* цє JavaScript файли, які завантажуються в іншому режимі (на відміну від *скриптів*, які завантажуються першоджерельним чином як JavaScript завжди працював). Цей інший режим необхідний, оскільки модулі мають дуже різну семантику, ніж скрипти:

1. Модуль коду автоматично запускається в строгому режимі, і немає ніякого способу, щоб відмовитися від строгого режиму.
1. Змінні, створені в верхньому рівні модуля не додаються автоматично в загальну глобальну область видимості. Вони існують тільки в межах верхньої області видимості модуля.
1. Значення `this` в верхньої області видимості модуля дорівнює `undefined`.
1. Модулі не дозволяють коментарі у HTML-стилі в коді (пережиточна риса JavaScript з ранніх днів браузерів).
1. Модулі повинні експортувати все, що повинно бути доступно коду поза модуля.
1. Модулі можуть імпортувати зв'язування з інших модулів.

Ці відмінності можуть здатися незначними на перший погляд, але вони являють собою значну зміну в тому, як завантажується JavaScript код і оцінку, яку я буду обговорювати протягом цієї глави. Реальна сила модулів є можливість експортувати і імпортувати тільки зв'язування яке вам потрібно, а не все в файлі. Добре розуміння експорту та імпорту має фундаментальне значення для розуміння того, як модулі відрізняються від скриптів.

## Базовий Експорт

Ви можете використовувати ключове слово `export`, щоб виставити частини опублікованого коду до інших модулів. У найпростішому випадку, ви можете помістити `export` перед будь-якою змінною, функціэю або декларації класу щоб експортувати його з модуля, наприклад так:

```js
// експорт даних
export var color = "red";
export let name = "Nicholas";
export const magicNumber = 7;

// експорт функції 
export function sum(num1, num2) {
    return num1 + num1;
}

// експорт класа
export class Rectangle {
    constructor(length, width) {
        this.length = length;
        this.width = width;
    }
}

// ця функція є приватною для модуля
function subtract(num1, num2) {
    return num1 - num2;
}

// оголошуємо функцїю…
function multiply(num1, num2) {
    return num1 * num2;
}

// …а потім експортумо її пізніше
export { multiply };
```

Є кілька речей, що помітні в цьому прикладі. По-перше, крім ключового слова `export`, кожне оголошення точно так же, як це було б в іншому випадку. Кожна експортована функція або клас також мають ім'я; це тому що для експорту функції або класу слід вказувати ім'я. Ви не можете експортувати анонімні функції або класи, використовуючи цей синтаксис, якщо ви не використовуєте ключове слово `default`  (детально обговорюється в розділі "Значення за замовчуванням в Модулях").

Далі, розглянемо функцію `multiply()`, що не експортується, коли вона визначена. Це працює, тому що вам не потрібно завжди експортувати об'явлене: ви можете також експортувати посилання. Нарешті, зверніть увагу, що цей приклад не експортує функцію `subtract()`. Ця функція не буде доступна з-за меж цього модуля, тому що будь-які змінні, функції або класи, які явно не експортуються залишаються приватними для модуля.

## Базовій Імпорт

Після того, як у вас є модуль з експортом, ви можете отримати доступ до його функціоналу в іншому модулі за допомогою ключового слова `import`. Дві частини в операторі `import` це ідентифікатори які ви імпортуєте і модуль, з якого слід імпортувати ці ідентифікатори. Це базовій вигляд  оператора:

```js
import { identifier1, identifier2 } from "./example.js";
```

Фігурні дужки після `import` вказують зв'язуванню для імпорту з даного модуля. Ключове слово `from` вказує на модуль, з якого імпортувати дане зв'язування. Модуль визначаэться строкою, що представляє шлях до модуля (так званий модуль до *специфікатора модуля*). Браузери використовують той самий формат шляху, який ви могли б пройти до елементу `<script>`, що означає, що ви повинні включати в розширення файлу. Node.js, з іншого боку, слідкуэ своэму традиційному договору відмінностей між локальними файлами і пакетами, заснованих на префіксах файлової системи. Наприклад, `example` буде пакет, а `./example.js` буде локальний файл.

I> Список зв'язувань для імпорту схожий на деструктований об'єкт, але це не він.

При імпорті зв'язувань з модуля, зв'язування веде себе так, як якщо б воно було визначено за допомогою `const`. Це означає, що ви не можете визначити іншу змінну з таким же ім'ям (в тому числі імпорту іншого зв'язування з тим же ім'ям), використовуйте ідентифікатор `import` перед об'явою, або змініть його значення.

### Імпорт Importing a Одиночного Зв'язування

Припустимо, що перший приклад в розділі "Базовий Експорт" знаходиться в модулі з ім'ям файлу `example.js`. Ви можете імпортувати і використовувати зв'язування з цього модуля в ряді напрямків. Наприклад, ви можете просто імпортувати один ідентифікатор:

```js
// імпорт тільки одного
import { sum } from "./example.js";

console.log(sum(1, 2));     // 3

sum = 1;        // помилка
```

Незважаючи на те, що `example.js` більше, ніж просто, одна функція цей приклад імпортує тільки функцію `sum()`. При спробі привласнити нове значення `sum`, результатом є помилкою, так як ви не можете перепризначити імпортовані зв'язування.

W> Переконайтеся в тому, щоб включити `/`, `./`, чи `../` на початку файлу який ви імпортуєте для кращої сумісності в різних браузерах і Node.js.

### Імпорт Кількох Зв'язувань

Якщо ви хочете імпортувати кілька зв'язувань з модуля, ви можете явно перерахувати їх в такий спосіб:

```js
// імпортуємо декілька
import { sum, multiply, magicNumber } from "./example.js";
console.log(sum(1, magicNumber));   // 8
console.log(multiply(1, 2));        // 2
```

Тут три зв'язування імпортуються з модуля: `sum`, `multiply` та `magicNumber`. Потім вони використовуються так, як якщо б вони були локально визначені.

### Імпорт Всього з Модуля

Є також особливий випадок, який дозволяє імпортувати весь модуль як єдиний об'єкт. Все експортоване буде доступно у цьому об'єкті в якості властивостей. Наприклад:

```js
// імпортувати все
import * as example from "./example.js";
console.log(example.sum(1,
        example.magicNumber));          // 8
console.log(example.multiply(1, 2));    // 2
```

У цьому коді все експортуються зв'язування в `example.js` завантажуються в об'єкт під названіем `example`. Названі експорту (Параметр `сума ()` функція, то `безліч ()` функції і `magicNumber`) потім доступні як свойства` example`. Цей формат імпорту називається * простору імен імпорт *, так як об'єкт `example` не існує внутрі` example.js` файлу і замість цього створюється для використання в якості об'єкта простору імен для всіх експортованих членів` прикладу. js`.

У цьому коді все експортовані зв'язування в `example.js` завантажуються в об'єкт під назвою `example`. Названі експорти (функція `сума ()` , функція `multiple()` і `magicNumber`) потім доступні як властивості ` example`. Цей формат імпорту називається *імпорт простору імен*, так як об'єкт `example` не існує всередині `example.js` файлу і замість цього створюється для використання в якості об'єкта простору імен для всіх експортованих членів `example.js`.

In this code, all exported bindings in `example.js` are loaded into an object called `example`. The named exports (the `sum()` function, the `multiple()` function, and `magicNumber`) are then accessible as properties on `example`. This import format is called a *namespace import* because the `example` object doesn't exist inside of the `example.js` file and is instead created to be used as a namespace object for all of the exported members of `example.js`.

Однак, майте на увазі, що незалежно від того, скільки разів ви використовуєте модуль в операторі `import`, модуль буде виконуватися тільки один раз. Після того, як код виконує імпорт модуля, інстанційований модуль зберігається в пам'яті і повторно використовуватися завжди, коли `import` знову буде звертатися до нього. Зверніть увагу на таке:

```js
import { sum } from "./example.js";
import { multiply } from "./example.js";
import { magicNumber } from "./example.js";
```

Незважаючи на те, є три оператори `import`, що містяться в даному модулі, `example.js` буде виконуватися тільки один раз. Якщо інші модулі в одному додатку повинні були імпортувати зв'язування з `example.js`, ці модулі будуть використовувати один і той же екземпляр модуля що цей код використовує.

A> ### Обмеження Синтаксису Модуля
A>
A> 
Важливим обмеженням як `export` так і `import` є те, що вони повинні бути використані за межами інших операторів і функцій. Наприклад, цей код буде давати помилку синтаксису:
A>
A> ```js
A> if (flag) {
A>     export flag;    // синтаксична помилка
A> }
A> ```
A>Вираз `export` всередині оператору `if`, не допускається. Експорт не може бути умовним або зроблений динамічно будьяким чином. Однією з причин цього синтаксису модуля, є можливість дозволити двигуну JavaScript визначити, що буде експортовано статично. Таким чином, ви можете використовувати тільки `export` на верхньому рівні модуля.

A>
A> Крім того, ви не можете використовувати `import` всередині виразу; ви можете використовувати його тільки на верхньому рівні. Це означає, що цей код також дає помилку синтаксису:
A>
A> ```js
A> function tryImport() {
A>     import flag from "./example.js";    // синтаксична помилка
A> }
A> ```
A>
A> Ви не можете динамічно імпортувати зв'язування з тієї ж причини з якої ви не можете динамічно експортувати зв'язування. `export` і `import` ключові слова призначені бути статичними, так що інструменти, такі як текстові редактори можуть легко сказати, яка інформація доступна з модуля.

### Тонкий Момент в Імпортуванні Зв'язування

В ECMAScript 6 вираз `import` створює тільки для лише для читання зв'язування до змінних, функцій і класів, а не просто зв'язування на оригінальні зв'язування як звичайні змінні. Навіть незважаючи на те, що модуль імпортує прив'язки не може змінити його значення, модуль, який експортує цей ідентифікатор може. Наприклад, припустимо, що ви хочете використовувати цей модуль:

```js
export var name = "Nicholas";
export function setName(newName) {
    name = newName;
}
```
При імпорті цих двох зв'язуваннь, функція `setName()` може змінити значення `name`:

```js
import { name, setName } from "./example.js";

console.log(name);       // "Nicholas"
setName("Greg");
console.log(name);       // "Greg"

name = "Nicholas";       // error
```

Виклик `setName("Greg")` повертається в модуль, з якого `setName()` експортувалася і виконується там, встановлюючи `name` в `"Greg"` натомість.

Зверніть увагу, ця зміна автоматично відображається на імпортованому зв'язуванні `name`.

Це тому, що `name` є локальним ім'ям для експортіруемого ідентифікатора `name`.

`name` використоване в коді вище і `name`, використовуване в модулі яке було імпортоване це не те ж саме.

## Перейменування: Експорт і Імпорт

Іноді, ви можете не захотіти використовувати оригінальне ім'я змінної, функції або класу яку ви імпортували з модуля. На щастя, ви можете змінити назву експорту як при експорті так і при імпорті.

У першому випадку, припустимо, що у вас є функція, яку ви хотіли експортувати з іншим ім'ям. Ви можете використовувати ключове слово `as`, щоб вказати ім'я, за яким функція буде відома, поза модуля:

```js
function sum(num1, num2) {
    return num1 + num2;
}

export { sum as add };
```

Тут функція `sum()` (`sum` є *місцева назва*) експортується як `add()` (`add` є *експортоване ім'я*). Це означає, що, коли інший модуль хоче імпортувати цю функцію, він повинен буде використовувати ім'я `add`:

```js
import { add } from "./example.js";
```

Якщо модуль який імпортуэ функцію хоче використовувати інше ім'я, він також може використовувати ключове солово `as`:

```js
import { add as sum } from "./example.js";
console.log(typeof add);            // "undefined"
console.log(sum(1, 2));             // 3
```

Цей код імпортує функцію `add()` використовуючи *import name* і перейменовує його в `sum()` (місцева назва). Це означає, що не існує ідентифікатор з ім'ям `add` в цьому модулі.

## Значення за Замовчуванням в Модулях

Синтаксис модуля дійсно оптимізований для експорту та імпорту значень за замовчуванням з модулів, так як ця модель була досить поширеним явищем в інших модульних системах, як CommonJS (інший специфікації для використання JavaScript поза браузера).

*Значення за замовчуванням* для модуля є однією змінною, функції або класу, як зазначено в ключовому словы `default`, і ви можете встановити тільки один експорт за замовчуванням для кожного модуля. Використання ключового слова `default` з декількома експортами є синтаксичної помилкою.

### Експорт Значень за Замовчуванням

Ось простий приклад, як використовується ключове слово `default`:

```js
export default function(num1, num2) {
    return num1 + num2;
}
```

Цей модуль експортує функцію в якості значення за замовчуванням. Ключове слово `default` вказує на те, що це експорт за замовчуванням. Функція не вимагає ім'я, тому що сам модуль являє собою функцію.

Крім того, можна вказати ідентифікатор як експорту за замовчуванням, помістивши його після `export default`, наприклад:

```js
function sum(num1, num2) {
    return num1 + num2;
}

export default sum;
```

Тут функція `sum()` визначена першою, а потім експортована в якості значення за замовчуванням для модуля. Ви можете вибрати цей підхід, якщо необхідно обчислити значення за замовчуванням.

Третій спосіб вказати ідентифікатор експорту як значення за замовчуванням є використання синтаксису перейменування, який виглядає наступним чином:

```js

function sum(num1, num2) {
    return num1 + num2;
}

export { sum as default };
```

Ідентифікатор `default` має особливе значення в експорті перейменовування і вказує що значення має бути за замовчуванням для модуля. Оскільки `default` це ключове слово в JavaScript, він не може бути використаний для змінної, функції або імені класу (але він може бути використаний в якості імені властивості). Таким чином, використання `default` для перейменування експорту є окремим випадком, щоб створити послідовність з тим, як визначаэться структура експорту не за замовчуванням. Цей синтаксис корисний, якщо ви хочете використовувати один `export` щоб вказати кілька експорті, в тому числі за замовчуванням, відразу.

### Імпорт Значень за Замовчуванням

Ви можете імпортувати значення за замовчуванням з модуля, використовуючи наступний синтаксис:

```js
// імпорт за замовчуванням
import sum from "./example.js";

console.log(sum(1, 2));     // 3
```

Цей оператор імпорту імпортує за замовчуванням з модуля `example.js`. Зверніть увагу, що не використовуються фігурні дужки, на відміну від того що ви бачили в імпорті не за замовчуванням . Місцева назва `sum` використовується для позначення будь-якіої функції за замовчуванням яку експортує модуль. Цей синтаксис є найчистішим, і творці ECMAScript 6 очікують, що він буде домінуючою формою імпорту в Інтернеті, що дозволяє використовувати вже існуючий об'єкт.

Для модулів, які експортують як за замовчуванням так і один або кілька не за замовчуванням зв'язувань, ви можете імпортувати всі експортовані зв'язування за допомогою одного оператора. Наприклад, припустимо, що у вас є цей модуль:

```js
export let color = "red";

export default function(num1, num2) {
    return num1 + num2;
}
```

Ви можете імпортувати як `color` і функцію за замовчуванням, використовуючи наступний `import`:

```js
import sum, { color } from "./example.js";

console.log(sum(1, 2));     // 3
console.log(color);         // "red"
```

Кома відділяє за замовчуванням локальне ім'я від імені не за замовчуванням, які теж оточені в фігурні дужки. Майте на увазі, що за замовчуванням повинне йти перед не за замовчуванням в виразі `import`.

Як і при експорті за замовчуванням, ви можете імпортувати значення за замовчуванням також з синтаксисом перейменування:

```js
// еквівалентно попередньому прикладу
import { default as sum, color } from "example";

console.log(sum(1, 2));     // 3
console.log(color);         // "red"
```

У цьому коді, експорт за замовчуванням (`default`) перейменовується в `sum` і додатковий `color` експорт також імпортується. Цей приклад еквівалентний попередньому прикладу.

## Пере-експорт Зв'язування

Може статися так, що ви б хотіли б реекспортувати те, що ваш модуль імпортувал (наприклад, якщо ви створюєте бібліотеку з кількох невеликих модулів). Ви можете повторно експортувати імпортоване значення з моделями, які вже обговорювалися в цьому розділі, в такий спосіб:

```js
import { sum } from "./example.js";
export { sum }
```

Це працює, але те ж саме також можна зробити одним оператором:

```js
export { sum } from "./example.js";
```

Ця форма `export` дивиться в зазначений модуль для об'яви `sum`, а потім експортує її. Звичайно, ви можете також вибрати для експорту інше ім'я для того ж значення:

```js
export { sum as add } from "./example.js";
```

Тут, `sum` імпортується з `"./example.js"`, а потім експортуються як `add`.

Якщо ви хочете експортувати все з іншого модуля, ви можете використовувати шаблон `*`:

```js
export * from "./example.js";
```

При експорті всього, ви включаете значення за замовчуванням як і усі інші іменовані експорти, що може вплинути на те, що ви можете експортувати з вашого модуля. Наприклад, якщо `example.js` має експорт за замовчуванням, вам не вдасться визначити новий експорт за замовчуванням при використанні цього синтаксису.

## Імпорт Без Зв'язувань

Деякі модулі можуть нічого не експортувати, а замість цього, тільки вносити зміни в об'єкти в глобальній області видимості. Навіть якщо змінні верхнього рівня, функції і класи всередині модулів автоматично не потрапляють в глобальну область видимості, це не означає, що модулі не можуть отримати доступ до глобальної області. Загальні визначення вбудованих об'єктів, таких як `Array` і `Object` доступні всередині модуля і зміни цих об'єктів будуть відображені в інших модулях.

Наприклад, якщо ви хочете додати `pushAll()` метод для всіх масивів, можна визначити модуль наступним чином:

```js
// код модуля без експорту або імпорту
Array.prototype.pushAll = function(items) {

    // items повинні бути масивом
    if (!Array.isArray(items)) {
        throw new TypeError("Argument must be an array.");
    }

    // використовуэмо вбудованный push() і оператор розкладу
    return this.push(...items);
};
```
Це корректний модуль, навіть якщо немає експорту або імпорту. Цей код може бути використаний як в якості модуля і сценарію. Так як він не експортує нічого, ви можете використовувати спрощений імпорт для виконання коду модуля без імпорту будь-яких зв'язувань:

```js
import "./example.js";

let colors = ["red", "green", "blue"];
let items = [];

items.pushAll(colors);
```

Цей імпорт коду виконує модуль, що містить метод `pushAll()`, так що `pushAll()` додається до прототипу масиву. Це означає, що `pushAll()` тепер доступний для використання у всіх масивах всередині цього модуля.

I> Imports without bindings are most likely to be used to create polyfills and shims.

## Завантаження Модулів

У той час як ECMAScript 6 визначає синтаксис для модулів, він не визначає, як завантажити їх. Це частина складності специфікації, яка повинна буди агностичною до реалізації в рызних оточеннях. Замість того щоб намагатися створити єдину специфікацію, яка буде працювати для всіх середовищ JavaScript, ECMAScript 6 визначає тільки синтаксис і тези з механізму завантаження який залишаэться невизначеннним до внутрішньої операції під назвою `HostResolveImportedModule`. Веб-браузери і Node.js надаэться можливість вирішити, як реалізувати `HostResolveImportedModule` таким чином, що буде мати сенс для їх середовищ.

### Використання Модулів в Веб-браузерах

Ще до ECMAScript 6, веб-браузери мали кілька способів, включати JavaScript у веб-додатки. Цими опціями завантаження скриптів є:

1. Завантаження файлів коду JavaScript за допомогою елемента `<script>` з атрибутом `src`, що вказує місце розташування, з якого завантажується код.
1. Вбудовування коду JavaScript інлайново за допомогою елемента `<script>` без атрибута `src`.
1. Завантаження файлів JavaScript коду для виконання в якості працівників (наприклад, веб-працівника або сервысного працівника).

Для того, щоб повною мірою підтримувати модулі, веб-браузери повинні були оновити кожен з цих механізмів. Ці деталы визначены в HTML специфікації, і я буду підсумовувати їх в цьому розділі.

#### Використання Модулів З `<script>`

Поведінка за замовчуванням елемента `<script>` є для завантаження файлів JavaScript, як скрипту (не модуля). Це відбувається, коли атрибут `type` відсутній або коли атрибут `type` містить контенту типу JavaScript (наприклад, `"text/javascript"`). Елемент `<script>` може потім виконати вбудований код або завантажити файл, вказаний в `src`. Для підтримки модулів, значення `"module"` було додано в якості опції `type`. Встановка `type` в значення `"module"` повідомляє браузеру, що завантажувати будь-який вбудований код або код, що міститься у файлі, заданним в `src` требя як модуль а не як скрипт. Ось простий приклад:

```html
<!-- завантажити модуль з JavaScript файлу -->
<script type="module" src="module.js"></script>

<!-- інлайн завантаження модуля -->
<script type="module">

import { sum } from "./example.js";

let result = sum(1, 2);

</script>
```

Перший елемент `<script>` в цьому прикладі завантажує зовнішній файл модуля, використовуючи атрибут `src`. Єдиною відміною від завантаження сценарію є те, що `"module"` прописан в `type`. Другий елемент `<script>` містить модуль, який вбудований безпосередньо в веб-сторінку. Змінна `result` не доступна глобально, тому що вона існує тільки всередині модуля (як це визначено в елементі `<script>`) і, отже, не додається до `window` як властивість.

Як ви можете бачити, спосіб підключення модулів на веб-сторінках досить простий і схожий з підключенням скриптів. Проте, є деякі відмінності в тому, як модулі завантажуються.

I> Можливо, ви помітили, що `"module"` не є типом контенту, як тип `"text/javascript"`. Файли модуля JavaScript будуть обслуговуватися з тим же типом контенту у вигляді файлів скриптів JavaScript, так що це не представляється можливим диференціювати виключно на основі типу контенту. Крім того, браузери ігнорують елементи `<script>`, коли `type` незрозумілий, тому браузери, які не підтримують модулі будуть автоматично ігнорювати лінію `<script type="module">`, забезпечуючи хорошу зворотну сумісність.

#### Module Loading Sequence in Web Browsers

Modules are unique in that, unlike scripts, they may use `import` to specify that other files must be loaded to execute correctly. To support that functionality, `<script type="module">` always acts as if the `defer` attribute is applied.

The `defer` attribute is optional for loading script files but is always applied for loading module files. The module file begins downloading as soon as the HTML parser encounters `<script type="module">` with a `src` attribute but doesn't execute until after the document has been completely parsed. Modules are also executed in the order in which they appear in the HTML file. That means the first `<script type="module">` is always guaranteed to execute before the second, even if one module contains inline code instead of specifying `src`. For example:

```html
<!-- this will execute first -->
<script type="module" src="module1.js"></script>

<!-- this will execute second -->
<script type="module">
import { sum } from "./example.js";

let result = sum(1, 2);
</script>

<!-- this will execute third -->
<script type="module" src="module2.js"></script>
```

These three `<script>` elements execute in the order they are specified, so `module1.js` is guaranteed to execute before the inline module, and the inline module is guaranteed to execute before `module2.js`.

Each module may `import` from one or more other modules, which complicates matters. That's why modules are parsed completely first to identify all `import` statements. Each `import` statement then triggers a fetch (either from the network or from the cache), and no module is executed until all `import` resources have first been loaded and executed.

All modules, both those explicitly included using `<script type="module">` and those implicitly included using `import`, are loaded and executed in order. In the preceding example, the complete loading sequence is:

1. Download and parse `module1.js`.
1. Recursively download and parse `import` resources in `module1.js`.
1. Parse the inline module.
1. Recursively download and parse `import` resources in the inline module.
1. Download and parse `module2.js`.
1. Recursively download and parse `import` resources in `module2.js`

Once loading is complete, nothing is executed until after the document has been completely parsed. After document parsing completes, the following actions happen:

1. Recursively execute `import` resources for `module1.js`.
1. Execute `module1.js`.
1. Recursively execute `import` resources for the inline module.
1. Execute the inline module.
1. Recursively execute `import` resources for `module2.js`.
1. Execute `module2.js`.

Notice that the inline module acts like the other two modules except that the code doesn't have to be downloaded first. Otherwise, the sequence of loading `import` resources and executing modules is exactly the same.

I> The `defer` attribute is ignored on `<script type="module">` because it already behaves as if `defer` is applied.

#### Asynchronous Module Loading in Web Browsers

You may already be familiar with the `async` attribute on the `<script>` element. When used with scripts, `async` causes the script file to be executed as soon as the file is completely downloaded and parsed. The order of `async` scripts in the document doesn't affect the order in which the scripts are executed, though. The scripts are always executed as soon as they finish downloading without waiting for the containing document to finish parsing.

The `async` attribute can be applied to modules as well. Using `async` on `<script type="module">` causes the module to execute in a manner similar to a script. The only difference is that all `import` resources for the module are downloaded before the module itself is executed. That guarantees all resources the module needs to function will be downloaded before the module executes; you just can't guarantee *when* the module will execute. Consider the following code:

```html
<!-- no guarantee which one of these will execute first -->
<script type="module" async src="module1.js"></script>
<script type="module" async src="module2.js"></script>
```

In this example, there are two module files loaded asynchronously. It's not possible to tell which module will execute first simply by looking at this code. If `module1.js` finishes downloading first (including all of its `import` resources), then it will execute first. If `module2.js` finishes downloading first, then that module will execute first instead.

#### Loading Modules as Workers

Workers, such as web workers and service workers, execute JavaScript code outside of the web page context. Creating a new worker involves creating a new instance `Worker` (or another class) and passing in the location of JavaScript file. The default loading mechanism is to load files as scripts, like this:

```js
// load script.js as a script
let worker = new Worker("script.js");
```

To support loading modules, the developers of the HTML standard added a second argument to these constructors. The second argument is an object with a `type` property with a default value of `"script"`. You can set `type` to `"module"` in order to load module files:

```js
// load module.js as a module
let worker = new Worker("module.js", { type: "module" });
```

This example loads `module.js` as a module instead of a script by passing a second argument with `"module"` as the `type` property's value. (The `type` property is meant to mimic how the `type` attribute of `<script>` differentiates modules and scripts.) The second argument is supported for all worker types in the browser.

Worker modules are generally the same as worker scripts, but there are a couple of exceptions. First, worker scripts are limited to being loaded from the same origin as the web page in which they are referenced, but worker modules aren't quite as limited. Although worker modules have the same default restriction, they can also load files that have appropriate Cross-Origin Resource Sharing (CORS) headers to allow access. Second, while a worker script can use the `self.importScripts()` method to load additional scripts into the worker, `self.importScripts()` always fails on worker modules because you should use `import` instead.

### Browser Module Specifier Resolution

All of the examples to this point in the chapter have used a relative module specifier path such as `"./example.js"`. Browsers require module specifiers to be in one of the following formats:

* Begin with `/` to resolve from the root directory
* Begin with `./` to resolve from the current directory
* Begin with `../` to resolve from the parent directory
* URL format

For example, suppose you have a module file located at `https://www.example.com/modules/module.js` that contains the following code:

```js
// imports from https://www.example.com/modules/example1.js
import { first } from "./example1.js";

// imports from https://www.example.com/example2.js
import { second } from "../example2.js";

// imports from https://www.example.com/example3.js
import { third } from "/example3.js";

// imports from https://www2.example.com/example4.js
import { fourth } from "https://www2.example.com/example4.js";
```

Each of the module specifiers in this example is valid for use in a browser, including the complete URL in the final line (you'd need to be sure `ww2.example.com` has properly configured its Cross-Origin Resource Sharing (CORS) headers to allow cross-domain loading). These are the only module specifier formats that browsers can resolve by default (though the not-yet-complete module loader specification will provide ways to resolve other formats). That means some normal looking module specifiers are actually invalid in browsers and will result in an error, such as:

```js
// invalid - doesn't begin with /, ./, or ../
import { first } from "example.js";

// invalid - doesn't begin with /, ./, or ../
import { second } from "example/index.js";
```

Each of these module specifiers cannot be loaded by the browser. The two module specifiers are in an invalid format (missing the correct beginning characters) even though both will work when used as the value of `src` in a `<script>` tag. This is an intentional difference in behavior between `<script>` and `import`.


## Summary

ECMAScript 6 adds modules to the language as a way to package up and encapsulate functionality. Modules behave differently than scripts, as they don't modify the global scope with their top-level variables, functions, and classes, and `this` is `undefined`. To achieve that behavior, modules are loaded using a different mode.

You must export any functionality you'd like to make available to consumers of a module. Variables, functions, and classes can all be exported, and there is also one default export allowed per module. After exporting, another module can import all or some of the exported names. These names act as if defined by `let` and operate as block bindings that can't be redeclared in the same module.

Modules need not export anything if they are manipulating something in the global scope. You can actually import from such a module without introducing any bindings into the module scope.

Because modules must run in a different mode, browsers introduced `<script type="module">` to signal that the source file or inline code should be executed as a module. Module files loaded with `<script type="module">` are loaded as if the `defer` attribute is applied to them. Modules are also executed in the order in which they appear in the containing document once the document is fully parsed.
