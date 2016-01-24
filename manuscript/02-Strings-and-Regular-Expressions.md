# Рядки та Регулярні вирази

Можливо, рядки є найбільш важливими типами даних в програмуванні. Вони є майже у всіх язиках програмування віщого рівня, і вміння працювати з ними ефективно є необхідністю для розробника, при створенні корисних програм. Але, якщо подивитися ширше, регулярні вирази є не менш важливими, тому що вони  дають розробнику додаткові потужні можливості при роботі з рядками. Пам'ятаючи це, засновники  ECMAScript 6 вдосконалили рядки і регулярні вирази,   додавши нові можливості та довго-очікувану функціональність. Цей розділ розгляне обидва типи змін.

## Краща підтримка Unicode (Юнікод)

До появи ECMAScript 6, рядки в JavaScript оберталися навколо 16-бітної системи  кодування символів. Усі властивості і методи рядків, як, наприклад, властивість `length`та метод `charAt()`, базувалися на ідеї, що 16-бітна послідовність представляє єдиній символ. ECMAScript 5 дозволяв JavaScript інтерпретаторам поміж двома варіантами кодування: UCS-2 або UTF-16. (Обидві системи використовують 16-бітні *блоки коду*, однаково обробляючі усі відстежувані операції.) Але вважалося що для кодування символів не потрібно більше ніж 16 біт, на щастя це більше не є абсолютом, дякуючи введенню розширеного набору символів Unicode.

### Кодові пункти UTF-16

Обмеження довжини кодування символів до 16 біт не дає можливості реалізувати основну мету Unicode з надання глобального унікального ідентифікатора кожному символу у світі. Ці глобальні унікальні ідентифікатори, так звані *кодові пункти*, просто номери, які починаються з 0.

Кодові пункти схожі на коди символів, між ними існує невелика різниця. Кодування символів перекладає кодові пункті в кодові блоки, які внутрішньо несуперечливі. В той час як UCS-2 зв’язує кодові пункти з кодовими блоками у співставленні один до одного, зв’язування в UTF-16 відбувається не завжди один до одного.

Перші 2^16 кодові пункти в UTF-16 представлені як одиничні 16-бітні кодові блоки. Цей діапазон називається *Основна Багатомовна Матриця* (ОБМ). Все, що поза межами цього діапазону вважається *додактовою матрицею*, де кодові блоки більше не можуть бути представлені лише у 16 бітах. UTF-16 вирішує цю проблему за допомогою *сурогатних пар*, в яких один кодовій пункт представлений двома 16-бітними кодовими блоками. Це означає, що будь який символ у рядку може бути представленій як одним кодовим блоком для ОБМ символів, даючи в сумі 16 біт, або ж двома кодовими блоками для символів в додактової матриці, даючи в сумі 32 біта.

У ECMAScript 5, всі рядкові операції працюють в діапазоні 16-бітних кодових блоків, припускаючи, що ви можете отримати неочікувані результати у рядку кодованому в UTF-16, який містить сурогатні пари. Наприклад:

```js
var text = "𠮷";

console.log(text.length);           // 2
console.log(/^.$/.test(text));      // false
console.log(text.charAt(0));        // ""
console.log(text.charAt(1));        // ""
console.log(text.charCodeAt(0));    // 55362
console.log(text.charCodeAt(1));    // 57271
```

В даному прикладі, єдиній Unicode символ представлений сурогатною парою, і як наслідок, JavaScript операції з рядком відбуваються, як з таким, що має два 16-бітні символи. Це означає:

* Властивість `length` у змінної `text` буде 2.
* Регулярний вираз, як спробує знайти одиничний символ, дасть `false`.
* Метод `charAt()` не в змозі повернуті рядок.

Метод `charCodeAt()` повертає відповідний 16-бітний для кожного кодового блоку, але це тільки наближене до реального значення, яке ви можете отримати з ECMAScript 5.

ECMAScript 6 забезпечую повну підтримку кодування рядків в UTF-16. Стандартизація операцій з рядками заснованими на цьому кодуванні, означає що JavaScript може підтримувати функціонал розроблений спеціально для роботи з сурогатними парами. Решта цього підрозділу розглядає кілька ключових прикладів цієї функціональності.

### Метод codePointAt()

Одним з методів доданих в ECMAScript 6 для повної підтримки UTF-16 є метод `codePointAt()`, який отримує кодові пункти Unicode, які зв’язані з відповідною позицією у рядку. Цей метод отримую позицію кодового пункту замість позиції символу та повертає числове значення, як показує цей приклад `console.log()`:

```js
var text = "𠮷a";

console.log(text.charCodeAt(0));    // 55362
console.log(text.charCodeAt(1));    // 57271
console.log(text.charCodeAt(2));    // 97

console.log(text.codePointAt(0));   // 134071
console.log(text.codePointAt(1));   // 57271
console.log(text.codePointAt(2));   // 97
```

Метод `codePointAt()` повертає те саме значення, що й метод `charCodeAt()` за винятком того, що він оперує також не-ОБМ символами. Перший символ змінної `text` є не-ОБМ символом і він представлений двома кодовими блоками, таким чином рядок має довжину трьох символів замість двох. Метод `charCodeAt()` повертає тільки перший кодовий блок для позиції 0, але`codePointAt()` повертає повний кодовий пункт незважаючи на те, що він містить два кодові блоки. Обидва методи повертають таке саме значення для позиції 1 (другий кодовий блок для першого символу) та 2 (символ `"a"`).

Виклик методу `codePointAt()` для символу є найкращим засобом, щоб дізнатися з складається символ з одного або двох кодових блоків. Ось функція, яку ви можете написати для перевірки:

```js
function is32Bit(c) {
    return c.codePointAt(0) > 0xFFFF;
}

console.log(is32Bit("𠮷"));         // true
console.log(is32Bit("a"));          // false
```

Верхня межа 16-бітових символів представлених в шістнадцятковому вигляді є `FFFF`, так що будь-який кодовий пункт вище цього числа має бути представлений двома кодовими блоками, в цілому 32 біта.

### Метод String.fromCodePoint()

Коли ECMAScript надає можливість щось роботи, він також надає можливість роботи те саме у зворотному порядку. Ви можете використати `codePointAt()` щоб визначити кодовій пункт для символу в рядку, в той час коли `String.fromCodePoint()` дає значення символу у рядку відповідно кодового пункту. Наприклад:

```js
console.log(String.fromCodePoint(134071));  // "𠮷"
```

Думайте про `String.fromCodePoint()`, як про вдосконалену версію метода  `String.fromCharCode()`. Обидва дають ті самі результати для символів в межах ОБМ. Різниця буде лише коли ви працюєте з символами за межами ОБМ.

### Метод normalize()

Іншим цікавим аспектом Unicode є те, що різні символи можуть вважатися еквівалентними для сортування або інших операцій заснованих на порівнянні. Є два шляхи визначення цих відносин. Перший, *канонічна рівність* має на увазі, що дві послідовності кодових пунктів є взаємозамінними у всіх відносинах. Наприклад, комбінація двох символів може бути канонічним еквівалентом одного символу. Друге співвідношення — *сумісність*. Дві сумісні послідовності кодових пунктів можуть виглядати різними, але можуть бути взаємозамінними в певних ситуаціях.

Відповідно до цих відносин рядки, які відображають з одного боку той самий текст, можуть мати різну послідовність кодових пунктів. Наприклад символ "æ" та рядок с двох символів "ae" можуть бути використані з взаємним успіхом, але не є повністю еквівалентними, поки їх певним чином не нормалізувати.

ECMAScript 6 підтримує нормалізацію форм Unicode, передаючі рядку метод `normalize()`. Цей метод опціонально приймає один параметр у вигляді рядка, який має містити одну з наступних форм Unicode нормалізації для подальшого використання:

* Форма Нормалізації Канонічна Композиція (`"NFC"`), використовується за замовчуванням
* Форма Нормалізації Канонічна Декомпозиція (`"NFD"`)
* Форма Нормалізації Сумісна Композиція (`"NFKC"`)
* Форма Нормалізації Сумісна Декомпозиція (`"NFKD"`)

Пояснення відмінностей між цими чотирма формами виходіть за межи цієї книги. Просто майте на увазі, що коли порівнюєте рядки, обидва рядки мають бути нормалізовані до однієї форми. Наприклад:

```js
var normalized = values.map(function(text) {
    return text.normalize();
});

normalized.sort(function(first, second) {
    if (first < second) {
        return -1;
    } else if (first === second) {
        return 0;
    } else {
        return 1;
    }
});
```

Цей код конвертує рядки в масив `values` у нормалізованній формі, таким чином масив може бути правильно відсортований. Ви також можете відсортувати оригінальний масив, використовуючи метод `normalize()` як частину *компаратора*, наприклад:

```js
values.sort(function(first, second) {
    var firstNormalized = first.normalize(),
        secondNormalized = second.normalize();

    if (firstNormalized < secondNormalized) {
        return -1;
    } else if (firstNormalized === secondNormalized) {
        return 0;
    } else {
        return 1;
    }
});
```

Повторимо це раз, що найважливішим в цьому коді є те, що обидва аргументи, `first` та `second`, будуть нормалізовані однаковим чином. Ці приклади використовують форму нормалізации за замовченням, NFC, але ви можете легко визначити іншу, наприклад:

```js
values.sort(function(first, second) {
    var firstNormalized = first.normalize("NFD"),
        secondNormalized = second.normalize("NFD");

    if (firstNormalized < secondNormalized) {
        return -1;
    } else if (firstNormalized === secondNormalized) {
        return 0;
    } else {
        return 1;
    }
});
```

Якщо ви не піклувалися про нормалізацію Unicode раніше, певно тоді цей метод буде не досить корисним для вас. Але якщо ви колись будете працювати з кодом для інтернаціональних програм, метод `normalize()` станеться вам у нагоді.

Методи не єдині поліпшення, які ECMAScript 6 впроваджує для роботи з рядками Unicode. Стандарт також пропонує два нові елементи синтаксису.

### Опція пошуку (flag) u в Регулярних Виразах

За допомогою регулярних виразів ви можете виконати багато базових операцій з рядками. Але треба пам’ятати, що регулярні вирази використовують 16-бітні кодові блоки, де кожен представляє один символ. Щоб зарадити цій проблемі, ECMAScript 6 вводить опцію пошуку `u` для регулярних виразів, які працюють з Unicode.

Коли регулярний вираз має опцію `u`, він переключається в стан роботи з символами, а не з кодовими блоками. Це означає, що регулярний вираз більше не буде збентежений сурогатними парами в рядку і має поводитись як треба. Як приклад, розглянемо цей код:

```js
var text = "𠮷";

console.log(text.length);           // 2
console.log(/^.$/.test(text));      // false
console.log(/^.$/u.test(text));     // true
```

Регулярний вираз `/^.$/` не знаходить жодного рядку, який би складався з одного символу. Використаний без опції `u`, цей регулярний вираз порівнює кодові блоки, тому Японський символ (якій представлений двома кодовими блоками) не відповідає регулярному виразу. Коли ж використовується опція `u`, регулярний вираз порівнює символи замість кодових блоків і таким чином Японський символ відповідає виразу.

Нажаль, ECMAScript 6 не може визначити скільки кодових пунктів містить рядок, але з визначеною опцією `u`, ви можете використати регулярний вираз, щоб реалізувати це таким чином:

```js
function codePointLength(text) {
    var result = text.match(/[\s\S]/gu);
    return result ? result.length : 0;
}

console.log(codePointLength("abc"));    // 3
console.log(codePointLength("𠮷bc"));   // 3
```

У цьому прикладі використовується `match()`, щоб перевірити `text` на символи пробілів і не пробілів, за допомогою регулярного виразу, який застосовано глобально та з підтримкою Unicode. Результат містить масив збігів, якщо наявний хоча б один збіг, то довжина масиву буде числом кодових пунктів у рядку. В Unicode, рядки `"abc"` та `"𠮷bc"` мають три символи, тому довжина масиву буде три.

W> Даний підхід працює, але не дуже швидко, особливо коли його застосувати до довгих рядків. Тому намагайтеся зменшити підрахунок кодових пунктів, якщо це можливо. Дякувати Господу, ECMAScript 7 буде мати вбудований метод підрахунку кодових пунктів.

Оскільки опція `u` є синтаксичною зміною, спроби використання її в JavaScript інтерпретаторах які не сумісні з ECMAScript 6 будуть провокувати синтаксичну помилку. Найнебезпечнішим шляхом встановити, чи підтримується опція `u` буде функція, на кшталт цієї:

```js
function hasRegExpU() {
    try {
        var pattern = new RegExp(".", "u");
        return true;
    } catch (ex) {
        return false;
    }
}
```

Ця функція використовує конструктор `RegExp`, щоб передати опцію `u` як аргумент. Такий синтаксис підтримується навіть старими JavaScript інтерпретаторами, але конструктор буде видавати помилку, якщо `u` не підтримується.

I> Якщо ваш код має працювати зі старими JavaScript інтерпретаторами, завжди використовуйте конструктор `RegExp` при використанні опції `u`. Це попередить виникнення синтаксичних помилок і дозволить визначити чи підтримується опція `u`без скасування виконання коду.

## Інші зміни для рядків

Функціонал рядків JavaScript завжди відставав від аналогічного в інших мовах. Тільки в ECMAScript 5 рядки, нарешті, отримали метод `trim()`. ECMAScript 6 продовжує розвивати функціонал JavaScript для роботи з рядками.

### Методи для визначення підрядків

З того часу, коли JavaScript був вперше представлений, розробники використовували метод `indexOf()` щоб визначити рядок всередині рядка. ECMAScript 6 містить слідуючі три методи для реалізації цієї дії:

* Метод `includes()` повертає `true`, якщо даний тест знайдений деінде у рядку. Та повертає `false`, якщо ні.
* Метод `startsWith()` повертає `true`, якщо даний текст знайдено на початку рядка. Та повертає `false`, якщо ні.
* Метод `endsWith()` повертає `true`, якщо даний текст знайдено у кінці рядка. Та повертає `false`, якщо ні.

Кожен з цих методів приймає два аргументи: текст, який треба знайти, та необов'язковий аргумент у вигляді індексу рядка з якого треба шукати. Коли надано другий аргумент, `includes()` та `startsWith()` починає пошук з вказаного індексу, в той час як `endsWith()` починає шукати з індексу, який рівний довжині рядка мінус вказаний аргумент; коли другий аргумент не надано, `includes()` та `startsWith()` шукають з початку рядка, в той час як `endsWith()` починає з кінця. Кажучи інакше, другий аргумент зменшує діапазон пошуку в рядку. Ось кілька прикладів цих методів в дії:

```js
var msg = "Hello world!";

console.log(msg.startsWith("Hello"));       // true
console.log(msg.endsWith("!"));             // true
console.log(msg.includes("o"));             // true

console.log(msg.startsWith("o"));           // false
console.log(msg.endsWith("world!"));        // true
console.log(msg.includes("x"));             // false

console.log(msg.startsWith("o", 4));        // true
console.log(msg.endsWith("o", 8));          // true
console.log(msg.includes("o", 8));          // false
```

В перших трьох викликах другий аргумент не вказано, тож пошук ведеться по всій довжині рядка. Останні три виклики перевіряють лише частину рядка. Виклик `msg.startsWith("o", 4)` починає шукати з індексу 4 змінної `msg` (що є "o" в "Hello"); виклик`msg.endsWith("o", 8)` починає шукати з індексу 4, тому що аргумент `8` віднімаємо від довжини рядка (12); виклик `msg.includes("o", 8)` починає шукати з індексу 8 (що буде "r" в "world").

Не зважаючи на те, що ці методи роблять визначення підрядка у рядку легшим, кожен з них повертає лише булеве значення. Якщо вам потрібно знайти дійсну позицію підрядка в рядку, треба використовувати методи `indexOf()` або `lastIndexOf()`.

W> Методи `startsWith()`, `endsWith()`, та `includes()` будуть видавати помилку, якщо ви передасте регулярний вираз замість рядка в якості аргументу. На відміну від `indexOf()` та `lastIndexOf()`, котрі конвертують регулярний вираз в рядок і потім шукають цей рядок.

### Метод repeat()

ECMAScript 6 також додає до рядків метод `repeat()`, який в якості аргументу приймає число рівне кількості повторів рядку. Він повертає новий рядок, який містить оригінальний рядок повторений вказану кількість разів. Наприклад:

```js
console.log("x".repeat(3));         // "xxx"
console.log("hello".repeat(2));     // "hellohello"
console.log("abc".repeat(4));       // "abcabcabcabc"
```

Цей метод надає важливий функціонал, який може бути надзвичайно корисним при маніпулюванні текстом. Це важливо в інструментах для форматування коду, наприклад:

```js
// indent using a specified number of spaces
var indent = " ".repeat(4),
    indentLevel = 0;

// whenever you increase the indent
var newIndent = indent.repeat(++indentLevel);
```

Перший виклик `repeat()` створить рядок з чотирма пробілами, а змінна `indentLevel` буде записувати рівень відступів. Тепер ви можете просто викликати `repeat()` зі збільшеним `indentLevel`, щоб змінити кількість відступів.

ECMAScript 6 також надає деякі корисні зміни до регулярних виразів, які не можна виділити в окрему категорію. Наступний розділ розгляне деякі з них.

## Other Regular Expression Changes

Regular expressions are an important part of working with strings in JavaScript, and like many parts of the language, they haven't changed much in recent versions. ECMAScript 6, however, makes several improvements to regular expressions to go along with the updates to strings.

### The Regular Expression y Flag

ECMAScript 6 standardized the `y` flag after it was implemented in Firefox as a proprietary extension to regular expressions. The `y` flag affects a regular expression search's `sticky` property, and it tells the search to start matching characters in a string at the position specified by the regular expression's `lastIndex` property. If there is no match at that location, then the regular expression stops matching. To see how this works, consider the following code:

```js
var text = "hello1 hello2 hello3",
    pattern = /hello\d\s?/,
    result = pattern.exec(text),
    globalPattern = /hello\d\s?/g,
    globalResult = globalPattern.exec(text),
    stickyPattern = /hello\d\s?/y,
    stickyResult = stickyPattern.exec(text);

console.log(result[0]);         // "hello1 "
console.log(globalResult[0]);   // "hello1 "
console.log(stickyResult[0]);   // "hello1 "

pattern.lastIndex = 1;
globalPattern.lastIndex = 1;
stickyPattern.lastIndex = 1;

result = pattern.exec(text);
globalResult = globalPattern.exec(text);
stickyResult = stickyPattern.exec(text);

console.log(result[0]);         // "hello1 "
console.log(globalResult[0]);   // "hello2 "
console.log(stickyResult[0]);   // Error! stickyResult is null
```

This example has three regular expressions. The expression in `pattern` has no flags, the one in `globalPattern` uses the `g` flag, and the one in `stickyPattern` uses the `y` flag. In the first trio of `console.log()` calls, all three regular expressions should return `"hello1 "` (with a space at the end).

After that, the `lastIndex` property is changed to 1 on all three patterns, meaning that the regular expression should start matching from the second character on all of them. The regular expression with no flags completely ignores the change to `lastIndex` and still matches `"hello1 "` without incident. The regular expression with the `g` flag goes on to match `"hello2 "` because it is searching forward from the second character of the string (`"e"`). The sticky regular expression doesn't match anything beginning at the second character so `stickyResult` is `null`.

The sticky flag saves the index of the next character after the last match in `lastIndex` whenever an operation is performed. If an operation results in no match, then `lastIndex` is set back to 0. The global flag behaves the same way, as demonstrated here:

```js
var text = "hello1 hello2 hello3",
    pattern = /hello\d\s?/,
    result = pattern.exec(text),
    globalPattern = /hello\d\s?/g,
    globalResult = globalPattern.exec(text),
    stickyPattern = /hello\d\s?/y,
    stickyResult = stickyPattern.exec(text);

console.log(result[0]);         // "hello1 "
console.log(globalResult[0]);   // "hello1 "
console.log(stickyResult[0]);   // "hello1 "

console.log(pattern.lastIndex);         // 0
console.log(globalPattern.lastIndex);   // 7
console.log(stickyPattern.lastIndex);   // 7

result = pattern.exec(text);
globalResult = globalPattern.exec(text);
stickyResult = stickyPattern.exec(text);

console.log(result[0]);         // "hello1 "
console.log(globalResult[0]);   // "hello2 "
console.log(stickyResult[0]);   // "hello2 "

console.log(pattern.lastIndex);         // 0
console.log(globalPattern.lastIndex);   // 14
console.log(stickyPattern.lastIndex);   // 14
```

The value of `lastIndex` changes to 7 after the first call to `exec()` and to 14 after the second call, for both the `stickyPattern` and `globalPattern` variables.

There are two more subtle details about the sticky flag to keep in mind:

1. The `lastIndex` property is only honored when calling methods that exist on the regular expression object, like the `exec()` and `test()` methods. Passing the regular expression to a string method, such as `match()`, will not result in the sticky behavior.
1. When using the `^` character to match the start of a string, sticky regular expressions only match from the start of the string (or the start of the line in multiline mode). While `lastIndex` is 0, the `^` makes a sticky regular expression no different from a non-sticky one. If `lastIndex` doesn't correspond to the beginning of the string in single-line mode or the beginning of a line in multiline mode, the sticky regular expression will never match.

As with other regular expression flags, you can detect the presence of `y` by using a property. In this case, you'd check the `sticky` property, as follows:

```js
var pattern = /hello\d/y;

console.log(pattern.sticky);    // true
```

The `sticky` property is set to true if the sticky flag is present, and the property is false if not. The `sticky` property is read-only based on the presence of the flag and cannot be changed in code.

Similar to the `u` flag, the `y` flag is a syntax change, so it will cause a syntax error in older JavaScript engines. You can use the following approach to detect support:

```js
function hasRegExpY() {
    try {
        var pattern = new RegExp(".", "y");
        return true;
    } catch (ex) {
        return false;
    }
}
```

Just like the `u` check, this returns false if it's unable to create a regular expression with the `y` flag. In one final similarity to `u`, if you need to use `y` in code that runs in older JavaScript engines, be sure to use the `RegExp` constructor when defining those regular expressions to avoid a syntax error.

### Duplicating Regular Expressions

In ECMAScript 5, you can duplicate regular expressions by passing them into the `RegExp` constructor like this:

```js
var re1 = /ab/i,
    re2 = new RegExp(re1);
```

The `re2` variable is justa  copy of the `re1` variable. But if you provide the second argument to the `RegExp` constructor, which specifies the flags for the regular expression, an error is thrown, as in this example:

```js
var re1 = /ab/i,

    // throws an error in ES5, okay in ES6
    re2 = new RegExp(re1, "g");
```

If you execute this code in an ECMAScript 5 environment, you'll get an error stating that the second argument cannot be used when the first argument is a regular expression. ECMAScript 6 changed this behavior such that the second argument is allowed and overrides whichever flags are present on the first argument. For example:

```js
var re1 = /ab/i,

    // throws an error in ES5, okay in ES6
    re2 = new RegExp(re1, "g");


console.log(re1.toString());            // "/ab/i"
console.log(re2.toString());            // "/ab/g"

console.log(re1.test("ab"));            // true
console.log(re2.test("ab"));            // true

console.log(re1.test("AB"));            // true
console.log(re2.test("AB"));            // false

```

In this code, `re1` has the case-insensitive `i` flag while `re2` has only the global `g` flag. The `RegExp` constructor duplicated the pattern from `re1` and substituted the `g` flag for the `i` flag. Without the second argument, `re2` would have the same flags as `re1`.

### The `flags` Property

Along with adding a new flag and changing how you can work with flags, ECMAScript 6 added a new property associated with them. In ECMAScript 5, you could get the text of a regular expression by using the `source` property, but to get the flag string, you'd have to parse the output of  the `toString()` method as shown below:

```js
function getFlags(re) {
    var text = re.toString();
    return text.substring(text.lastIndexOf("/") + 1, text.length);
}

// toString() is "/ab/g"
var re = /ab/g;

console.log(getFlags(re));          // "g"
```

This code converts a regular expression into a string and then returns the characters found after the last `/`. Those characters are the flags.

ECMAScript 6 makes fetching flags easier by adding a `flags` property to go along with the `source` property. Both properties are prototype accessor properties with only a getter assigned, making them read-only. The `flags` property makes inspecting regular expressions easier for both debugging and inheritance purposes.

A late addition to ECMAScript 6, the `flags` property returns the string representation of any flags applied to a regular expression. For example:

```js
var re = /ab/g;

console.log(re.source);     // "ab"
console.log(re.flags);      // "g"
```

This fetches all flags on `re` and prints them to the console with far fewer lines of code than the `toString()` technique can. Using `source` and `flags` together allows you to extract the pieces of the regular expression that you need without parsing the regular expression string directly.

All of the changes to strings and regular expressions that this chapter has covered so far are definitely powerful, but ECMAScript 6 improves your power over strings in a much bigger way. It brings a new type of literal to the table that makes strings more flexible.

## Template Literals

JavaScript's strings have always been fairly limited when compared to those in other languages. Since JavaScript's inception, strings have lacked the methods covered so far in this chapter and string concatenation is as simple as possible. *Template literals* add new syntax for creating domain-specific languages (DSLs) for working with content in a way that is safer than the solutions we have today. DSLs are languages designed for a specific, narrow purpose (as opposed to JavaScript, which is a general-purpose language) and the ability to create DSLs inside of JavaScript was desired to deal with some of the more complex problems facing JavaScript developers. The ECMAScript wiki offers the following description on the [template literal strawman](http://wiki.ecmascript.org/doku.php?id=harmony:quasis):

> This scheme extends ECMAScript syntax with syntactic sugar to allow libraries to provide DSLs that easily produce, query, and manipulate content from other languages that are immune or resistant to injection attacks such as XSS, SQL Injection, etc.

In reality, though, template literals are ECMAScript 6's answer to the following features that JavaScript lacked all the way through ECMAScript 5:

* **Multiline strings** A formal concept of multiline strings.
* **Basic string formatting** The ability to substitute parts of the string for values contained in variables.
* **HTML escaping** The ability to transform a string such that it is safe to insert into HTML.

Rather than trying to add more functionality to JavaScript's already-existing strings, template literals represent an entirely new approach to solving these problems.

### Basic Syntax

At their simplest, template literals act like regular strings delimited by backticks (`` ` ``) instead of double or single quotes. For example, consider the following:

```js
let message = `Hello world!`;

console.log(message);               // "Hello world!"
console.log(typeof message);        // "string"
console.log(message.length);        // 12
```

This code demonstrates that the variable `message` contains a normal JavaScript string. The template literal syntax is only is used to create the string value, which is then assigned to the `message` variable.

If you want to use a backtick in your string, then just escape it with a backslash (`\`), as in this version of the `message` variable:

```js
let message = `\`Hello\` world!`;

console.log(message);               // "`Hello` world!"
console.log(typeof message);        // "string"
console.log(message.length);        // 14
```

There's no need to escape either double or single quotes inside of template literals.

### Multiline Strings

JavaScript developers have wanted a way to create multiline strings since the first version of the language. But when using double or single quotes, strings must be completely contained on a single line.

#### Pre-ECMAScript 6 Workarounds

Thanks to a long-standing syntax bug, JavaScript does have a workaround. You can create multiline strings if there's a backslash (`\`) before a newline. Here's an example:

```js
var message = "Multiline \
string";

console.log(message);       // "Multiline string"
```

The `message` string has no newlines present when printed to the console because the backslash is treated as a continuation rather than a newline. In order to show a newline in output, you'd need to manually include it:

```js
var message = "Multiline \n\
string";

console.log(message);       // "Multiline
                            //  string"
```

This should print `Multiline String` on two separate lines in all major JavaScript engines, but the behavior is defined as a bug and many developers recommend avoiding it.

Other pre-ECMAScript 6 attempts to create multiline strings usually relied on arrays or string concatenation, such as:

```js
var message = [
    "Multiline ",
    "string"
].join("\n");

let message = "Multiline \n" +
    "string";
```

All of the ways developers worked around JavaScript's lack of multiline strings left something to be desired.

#### Multiline Strings the Easy Way

ECMAScript 6's template literals make multiline strings easy because there's no special syntax. Just include a newline where you want, and it shows up in the result. For example:

```js
let message = `Multiline
string`;

console.log(message);           // "Multiline
                                //  string"
console.log(message.length);    // 16
```

All whitespace inside the backticks is part of the string, so be careful with indentation. For example:

```js
let message = `Multiline
               string`;

console.log(message);           // "Multiline
                                //                 string"
console.log(message.length);    // 31
```

In this code, all whitespace before the second line of the template literal is considered part of the string itself. If making the text line up with proper indentation is important to you, then consider leaving nothing on the first line of a multiline template literal and then indenting after that, as follows:

```js
let html = `
<div>
    <h1>Title</h1>
</div>`.trim();
```

This code begins the template literal on the first line but doesn't have any text until the second. The HTML tags are indented to look correct and then the `trim()` method is called to remove the initial empty line.

A> If you prefer, you can also use `\n` in a template literal to indicate where a newline should be inserted:
A> {:lang="js"}
A> ~~~~~~~~
A>
A> let message = `Multiline\nstring`;
A>
A> console.log(message);           // "Multiline
A>                                 //  string"
A> console.log(message.length);    // 16
A> ~~~~~~~~

### Making Substitutions

At this point, template literals may look like fancier versions of normal JavaScript strings. The real difference between the two lies in template literal *substitutions*. Substitutions allow you to embed any valid JavaScript expression inside a template literal and output the result as part of the string.

Substitutions are delimited by an opening `${` and a closing `}` that can have any JavaScript expression inside. The simplest substitutions let you embed local variables directly into a resulting string, like this:

```js
let name = "Nicholas",
    message = `Hello, ${name}.`;

console.log(message);       // "Hello, Nicholas."
```

The substitution `${name}` accesses the local variable `name` to insert `name` into the `message` string. The `message` variable then holds the result of the substitution immediately.

I> A template literal can access any variable accessible in the scope in which it is defined. Attempting to use an undeclared variable in a template literal throws an error in both strict and non-strict modes.

Since all substitutions are JavaScript expressions, you can substitute more than just simple variable names. You can easily embed calculations, function calls, and more. For example:

```js
let count = 10,
    price = 0.25,
    message = `${count} items cost $${(count * price).toFixed(2)}.`;

console.log(message);       // "10 items cost $2.50."
```

This code performs a calculation as part of the template literal. The variables `count` and `price` are multiplied together to get a result, and then formatted to two decimal places using `.toFixed()`. The dollar sign before the second substitution is output as-is because it's not followed by an opening curly brace.

### Tagged Templates

Now you've seen how template literals can create multiline strings and insert values into strings without concatenation. But the real power of template literals comes from tagged templates. A *template tag* performs a transformation on the template literal and returns the final string value. This tag is specified at the start of the template, just before the first `` ` `` character, as shown here:

```js
let message = tag`Hello world`;
```

In this example, `tag` is the template tag to apply to the `` `Hello world` `` template literal.

#### Defining Tags

A *tag* is simply a function that is called with the processed template literal data. The tag receives data about the template literal as individual pieces and must combine the pieces to create the result. The first argument is an array containing the literal strings as interpreted by JavaScript. Each subsequent argument is the interpreted value of each substitution.

Tag functions are typically defined using rest arguments as follows, to make dealing with the data easier:

```js
function tag(literals, ...substitutions) {
    // return a string
}
```

To better understand what gets passed to tags, consider the following:

```js
let count = 10,
    price = 0.25,
    message = passthru`${count} items cost $${(count * price).toFixed(2)}.`;
```

If you had a function called `passthru()`, that function would receive three arguments. First, it would get a `literals` array, containing the following elements:

* The empty string before the first substitution (`""`)
* The string after the first substitution and before the second (`" items cost $"`)
* The string after the second substitution (`"."`)

The next argument would be `10`, which is the interpreted value for the `count` variable. This becomes the first element in a `substitutions` array. The final argument would be `"2.50"`, which is the interpreted value for `(count * price).toFixed(2)` and the second element in the `substitutions` array.

Note that the first item in `literals` is an empty string. This ensures that `literals[0]` is always the start of the string, just like `literals[literals.length - 1]` is always the end of the string. There is always one fewer substitution than literal, which means the expression `substitutions.length === literals.length - 1` is always true.

Using this pattern, the `literals` and `substitutions` arrays can be interwoven to create a resulting string. The first item in `literals` comes first, the first item in `substitutions` is next, and so on, until the string is complete. As an example, you can mimic the default behavior of a template literal by alternating values from these two arrays:

```js
function passthru(literals, ...substitutions) {
    let result = "";

    // run the loop only for the substitution count
    for (let i = 0; i < substitutions.length; i++) {
        result += literals[i];
        result += substitutions[i];
    }

    // add the last literal
    result += literals[literals.length - 1];

    return result;
}

let count = 10,
    price = 0.25,
    message = passthru`${count} items cost $${(count * price).toFixed(2)}.`;

console.log(message);       // "10 items cost $2.50."
```

This example defines a `passthru` tag that performs the same transformation as the default template literal behavior. The only trick is to use `substitutions.length` for the loop rather than `literals.length` to avoid accidentally going past the end of the `substitutions` array. This works because the relationship between `literals` and `substitutions` is well-defined in ECMAScript 6.

I> The values contained in `substitutions` are not necessarily strings. If an expression evaluates to a number, as in the previous example, then the numeric value is passed in. Determining how such values should output in the result is part of the tag's job.

#### Using Raw Values in Template Literals

Template tags also have access to raw string information, which primarily means access to character escapes before they are transformed into their character equivalents. The simplest way to work with raw string values is to use the built-in `String.raw()` tag. For example:

```js
let message1 = `Multiline\nstring`,
    message2 = String.raw`Multiline\nstring`;

console.log(message1);          // "Multiline
                                //  string"
console.log(message2);          // "Multiline\\nstring"
```

In this code, the `\n` in `message1` is interpreted as a newline while the `\n` in `message2` is returned in its raw form of `"\\n"` (the slash and `n` characters). Retrieving the raw string information like this allows for more complex processing when necessary.

The raw string information is also passed into template tags. The first argument in a tag function is an array with an extra property called `raw`. The `raw` property is an array containing the raw equivalent of each literal value. For example, the value in `literals[0]` always has an equivalent `literals.raw[0]` that contains the raw string information. Knowing that, you can mimic `String.raw()` using the following code:

```js
function raw(literals, ...substitutions) {
    let result = "";

    // run the loop only for the substitution count
    for (let i = 0; i < substitutions.length; i++) {
        result += literals.raw[i];      // use raw values instead
        result += substitutions[i];
    }

    // add the last literal
    result += literals.raw[literals.length - 1];

    return result;
}

let message = raw`Multiline\nstring`;

console.log(message);           // "Multiline\\nstring"
console.log(message.length);    // 17
```

This uses `literals.raw` instead of `literals` to output the string result. That means any character escapes, including Unicode code point escapes, should be returned in their raw form.Raw strings are helpful when you want to output a string containing code in which you'll need to include the character escaping (for instance, if you want to generate documentation about some code, you may want to output the actual code as it appears).

## Summary

Full Unicode support allows JavaScript to deal with UTF-16 characters in logical ways. The ability to transfer between code point and character via `codePointAt()` and `String.fromCodePoint()` is an important step for string manipulation. The addition of the regular expression `u` flag makes it possible to operate on code points instead of 16-bit characters, and the `normalize()` method allows for more appropriate string comparisons.

ECMAScript 6 also added new methods for working with strings, allowing you to more easily identify a substring regardless of its position in the parent string. More functionality was added to regular expressions, too.

Template literals are an important addition to ECMAScript 6 that allows you to create domain-specific languages (DSLs) to make creating strings easier. The ability to embed variables directly into template literals means that developers have a safer tool than string concatenation for composing long strings with variables.

Built-in support for multiline strings also makes template literals a useful upgrade over normal JavaScript strings, which have never had this ability. Despite allowing newlines directly inside the template literal, you can still use `\n` and other character escape sequences.

Template tags are the most important part of this feature for creating DSLs. Tags are functions that receive the pieces of the template literal as arguments. You can then use that data to return an appropriate string value. The data provided includes literals, their raw equivalents, and any substitution values. These pieces of information can then be used to determine the correct output for the tag.
