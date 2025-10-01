# Лекція 5: Операції агрегації

## Що таке агрегація в MongoDB?
Агрегація в MongoDB — це процес обробки даних, який дозволяє збирати, трансформувати і обчислювати інформацію з багатьох документів у колекції. Для цього використовується конвеєр агрегації (aggregation pipeline), що складається з послідовності етапів (операторів), які трансформують документ крок за кроком. Результати попереднього етапу є вхідними для наступного.

## Основні етапи агрегації в MongoDB
**$match** — фільтрує документи за певною умовою, пропускає далі тільки ті, що відповідають цій умові. Наприклад, вибірка акаунтів із балансом менше 1000:

```js
{ "$match": { "balance": { "$lt": 1000 } } }
```

**$group** — групує документи за певним ключем (_id), обчислюючи агрегатні функції (**$sum**, **$max**, **$avg** тощо). Наприклад, обчислення середнього балансу за типом акаунта:

```js
{ "$group": { "_id": "$account_type", "avg_balance": { "$avg": "$balance" } } }
```

**$project** — формує нову структуру результату, додаючи або виключаючи поля. Наприклад, показати лише ім'я та баланс, виключивши _id:

```js
{ "$project": { "name": 1, "balance": 1, "_id": 0 } }
```

**$sort** — сортує документи за значенням одного або кількох полів (1 — за зростанням, -1 — за спаданням):

```js
{ "$sort": { "balance": -1 } } 
```

**$lookup** — виконує об’єднання даних між колекціями (аналог JOIN):

```js
{ "$lookup": {
    "from": "other_collection",
    "localField": "field_in_current_collection",
    "foreignField": "field_in_other_collection",
    "as": "joined_docs"
  }
}
```

**$unwind** — розвертає масиви в окремі документи.

```js
{ "$unwind": "$array_field" }
```

Ці стадії можна комбінувати послідовно у pipeline для гнучкої обробки даних.

Простий приклад агрегації, що фільтрує акаунти, групує їх за типом і виводить середній баланс:

```js
[
  { "$match": { "balance": { "$lt": 1000 } } },
  { "$group": { "_id": "$account_type", "avg_balance": { "$avg": "$balance" } } }
]
```

## Приклад агрегації:
Колекція "sales" (продажі):

```json
[
  { "_id": 1, "item": "notebook", "section": "electronics", "sold": 10, "amount": 1000 },
  { "_id": 2, "item": "phone", "section": "electronics", "sold": 20, "amount": 2000 },
  { "_id": 3, "item": "pen", "section": "stationery", "sold": 15, "amount": 150 }
]
```

Агрегація для підрахунку загального продажу і максимального продажу у кожній секції:

```js
db.sales.aggregate([
  { $group: { _id: "$section", total_sold: { $sum: "$sold" }, max_amount: { $max: "$amount" } } }
])
```

Результат:

```json
[
  { "_id": "electronics", "total_sold": 30, "max_amount": 2000 },
  { "_id": "stationery", "total_sold": 15, "max_amount": 150 }
]
```

## Зв'язки та агрегації
1. Зв’язок "один до одного", колекції:

* users: користувачі

* profiles: профілі користувачів

Приклад схеми:

```js
// users
{
  _id: ObjectId("..."),
  name: "Іван",
  profile_id: ObjectId("...") // посилання на профіль
}

// profiles
{
  _id: ObjectId("..."),
  age: 30,
  city: "Київ"
}
```

CRUD з агрегацією та зв’язком "один до одного"
Читання (Read) з об’єднанням профілю до користувача:

```js
db.users.aggregate([
  {
    $lookup: {
      from: "profiles",
      localField: "profile_id",
      foreignField: "_id",
      as: "profile"
    }
  },
  { $unwind: "$profile" }
])

```

Результат:

```json
[
  {
    "_id": "...",
    "name": "Іван",
    "profile_id": "...",
    "profile": { "age": 30, "city": "Київ" }
  }
]
```

2. Зв’язок "один до багатьох", колекції:

* authors: автори книг

* books: книги з посиланням на автора

Приклад схеми:

```js
// authors
{
  _id: ObjectId("..."),
  name: "Петро Іванов"
}

// books
{
  _id: ObjectId("..."),
  title: "Книга 1",
  author_id: ObjectId("...") // посилання на автора
}
```

Агрегація для читання авторів з їх книгами:

```js
db.authors.aggregate([
  {
    $lookup: {
      from: "books",
      localField: "_id",
      foreignField: "author_id",
      as: "books"
    }
  }
])
```

Результат:

```json
[
  {
    "_id": "...",
    "name": "Петро Іванов",
    "books": [
      { "_id": "...", "title": "Книга 1", "author_id": "..." },
      { "_id": "...", "title": "Книга 2", "author_id": "..." }
    ]
  }
]
```

Для створення, оновлення і видалення можна комбінувати агрегацію з командами:

Для вставки (Create) використовують **insertOne**/**insertMany**.

Для оновлення (Update) — **updateOne**/**updateMany**.

Для видалення (Delete) — **deleteOne**/**deleteMany**.

Для читання (Read) — **aggregate** (паплайн агрегації).

3. Зв’язок "багато до багатьох", колекції:

* students: студенти

* courses: курси

* student_courses: колекція для багаточисельного зв’язку

Приклад:

```js
// students
{
  _id: ObjectId("..."),
  name: "Олена"
}

// courses
{
  _id: ObjectId("..."),
  title: "MongoDB для початківців"
}

// student_courses
{
  student_id: ObjectId("..."),
  course_id: ObjectId("...")
}
```

Агрегація для формування зв'язку студентів та курсів
Для виведення інформації про студентів з назвами курсів:

```js
db.students.aggregate([
  {
    $lookup: {
      from: "student_courses",
      localField: "_id",
      foreignField: "student_id",
      as: "enrollments"
    }
  },
  { $unwind: "$enrollments" },
  {
    $lookup: {
      from: "courses",
      localField: "enrollments.course_id",
      foreignField: "_id",
      as: "course"
    }
  },
  { $unwind: "$course" },
  {
    $group: {
      _id: "$_id",
      name: { $first: "$name" },
      courses: { $push: "$course.title" }
    }
  }
])
```

Результат:

```json
[
  {
    "_id": "...",
    "name": "Олена",
    "courses": ["MongoDB для початківців", "JavaScript для початківців"]
  }
]
```
Щодо операцій агрегації в MongoDB слід підкреслити, що агрегація є одним із найпотужніших інструментів цієї NoSQL бази даних. Вони дозволяють не просто виконувати пошук документів, а й складно трансформувати, аналізувати та обробляти великі обсяги інформації у вигляді конвеєра складних етапів.
