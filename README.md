# Рoзуміння ECMAScript 6

[![PDF][pdf-image]][pdf-url]
[![ePub][epub-image]][epub-url]
[![Mobi][mobi-image]][mobi-url]
[![Build Status][travis-image]][travis-url]
[![Twitter][twitter-image]][twitter-url]
[![Facebook][facebook-image]][facebook-url]
[![Slack][slack-image]][slack-url]
[![RSS][rss-image]][rss-url]
[![Stars][github-image]][github-url]

> Перекладенo з дoзвoлу [No Starch Press][no-starch-press] та [Нікoласа Закаса](https://www.nczonline.net/).  
> Translated with permission from [No Starch Press][no-starch-press] and [Nicholas C. Zakas](https://www.nczonline.net/).

ECMAScript 6 відображає найбільші зміни ядра JavaScript у його історії. Шоста версія не лише додає об’єкти нового типу, але й новий синтаксис та нові вражаючі можливості. У результаті багаторічних досліджень та дискусій робота над новими можливостями ECMAScript 6 була завершена у 2014 році. Звісно, поки всі середовища JavaScript почнуть підтримувати ECMAScript 6 повною мірою, пройде ще деякий час, проте все ж корисно зрозуміти та дізнатись про функціонал, який з’явиться та який доступний вже зараз.

Ця книга є посібником для переходу з 5-ої на 6-у версію ECMAScript. Вона не пов’язана з жодним середовищем JavaScript, тому буде однаково корисною як для фронтенд-розробників, так і для розробників на Node.js

Ви дізнаєтесь про:

* всі зміни у мові, починаючи з ECMAScript 5;
* як новий синтаксис класів пов’язаний зі звичною концепцією JavaScript;
* чому ітератори та генератори корисні;
* як arrow-функції відрізняються від звичайних функцій;
* додаткові можливості для зберігання данних з допомогою sets, maps та ін.;
* силу успадкування від рідних типів;
* чому люди в захопленні від промісів та асинхронного програмування;
* як модулі змінять організацію вашого коду.

## Де читати

Переклад доступний для завантаження у форматах [PDF][pdf-url], [ePub][epub-url] та [Mobi][mobi-url]. Онлайн-версія перекладу [доступна для читання][site-url] безкоштовно та містить найсвіжіші зміни. Розділи можуть бути незакінченими, проте переклад має бути правильним. Переклад оновлюється кілька разів на місяць.

Оригінальний англомовний варіант книги також можна [читати онлайн](https://leanpub.com/understandinges6/read/).

## Придбати копію

Ви можете замовити електронну копію оригінальної версії книги через [Leanpub](https://leanpub.com/understandinges6). Детальніше дізнавайтесь [за посиланням](https://github.com/nzakas/understandinges6/blob/master/README.md#purchasing-a-copy).

Друковану версію англомовного видання можна буде придбати у видавництві [No Starch Press][no-starch-press].

На жаль, друковану версію перекладу придбати неможливо, через відсутність видавця. Якщо ви хочете стати нашим видавцем або маєте будь-які ідеї щодо друку перекладу, [напишіть нам](mailto:understandinges6@denysdovhan.com).

## Допомога автору

Ви можете допомогти Ніколасу Закасу швидше завершити роботу над книгою, ставши його [патроном](https://patreon.com/nzakas).

## Підтримка перекладу

Якщо Вам сподобався цей переклад і ви хочете допомогти нам, перш за все, ми дякуємо Вам! Є декілька способів посприяти нам:

### Написати нам

Якщо Ви помітили яку-небудь помилку, [повідомте нас](https://github.com/LambdaBooks/understandinges6ua/issues), або виправте та надішліть [пул–реквест](https://github.com/LambdaBooks/understandinges6ua/compare).

Не соромтесь надсилати запитання та побажання, які стосуються перекладу книги. Ми обов’язково візьмемо до уваги конструктивну критику з вашого боку.

### Підтримати матеріально

Ви також можете надіслати кошти в підтримку проекту на картку:

**4149 4378 5069 5501**

## Команда перекладачів

Цей переклад результат наполегливої та злагодженої роботи нашої команди:

* [_Денис Довгань_](https://twitter.com/denysdovhan) — автор перекладу.
* [_Маріанна Чуприна_](https://twitter.com/marianna_ch_a) — коректор.
* [_Олександр Закритий_](https://twitter.com/nevusnews) — коректор.

## Подяки

Ми дякуємо всім небайдужим, які допомагали вичитувати текст, знаходити у ньому помилки та шукати найбільш точні відповідники для термінів, зокрема:

* _Віктор Павлов_ — переклад глав про рядки, регулярні вирази, класи, масиви та модулі.
* _Террі Сагайдак_ — переклад глави про блочні зв’язування.
* _Антон Трофименко_ — переклад глави про модулі.
* _Олена Совин_ — численні корекції.
* _Богдан Денисюк_ — виправлення опечаток.
* _Сергій Гіба_ — допомога з главою про проксі та рефлексії.
* _Олексій Швайка_ — численні зауваження та виправлення.
* [та інші…](https://github.com/denysdovhan/understandinges6ua/graphs/contributors)

## Ліцензія

[CC BY-NC-SA 3.0][cc-by-nc-sa-3.0] © [Denys Dovhan](http://denysdovhan.com)

<!-- Download links -->

[site-url]: http://understandinges6.denysdovhan.com/

[pdf-url]: https://www.gitbook.com/download/pdf/book/LambdaBooks/understandinges6ua
[pdf-image]: https://img.shields.io/badge/get-PDF-EB4E33.svg?style=flat-square

[epub-url]: https://www.gitbook.com/download/epub/book/LambdaBooks/understandinges6ua
[epub-image]: https://img.shields.io/badge/get-ePub-85B916.svg?style=flat-square

[mobi-url]: https://www.gitbook.com/download/mobi/book/LambdaBooks/understandinges6ua
[mobi-image]: https://img.shields.io/badge/get-Mobi-E8A138.svg?style=flat-square

<!-- References -->

[cc-by-nc-sa-3.0]: http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US
[no-starch-press]: https://www.nostarch.com/

[travis-url]: https://travis-ci.org/LambdaBooks/understandinges6ua
[travis-image]: https://img.shields.io/travis/LambdaBooks/understandinges6ua.svg?style=flat-square

[twitter-url]: https://twitter.com/LambdaBooks
[twitter-image]: https://img.shields.io/badge/twitter-%40LambdaBooks-00ACEE.svg?style=flat-square

[facebook-url]: https://facebook.com/lambdabooks
[facebook-image]: https://img.shields.io/badge/facebook-%40LambdaBooks-4267b2.svg?style=flat-square

[slack-url]:  http://slack.lambdabooks.com
[slack-image]: https://img.shields.io/badge/slack-LambdaBooks-red.svg?style=flat-square

[rss-url]: http://understandinges6.denysdovhan.com/rss.xml
[rss-image]: https://img.shields.io/badge/rss-subscribe-F4B83F.svg?style=flat-square

[github-url]: https://github.com/LambdaBooks/understandinges6ua
[github-image]: https://img.shields.io/github/stars/LambdaBooks/understandinges6ua.svg?style=social&label=Star
