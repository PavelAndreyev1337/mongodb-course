const db = connect("mongodb://localhost:27017/lb8");

db.articles.drop()

db.articles.insertMany([
  {
    title: "Вступ до MongoDB",
    content: "MongoDB — це популярна NoSQL база даних, яка зберігає дані у форматі JSON.",
    author: "Іван Петров",
    date: new Date("2023-05-01")
  },
  {
    title: "Основи повнотекстового пошуку",
    content: "Повнотекстовий пошук у MongoDB дозволяє ефективно шукати за текстом в полях.",
    author: "Олена Сидорова",
    date: new Date("2023-06-15")
  },
  {
    title: "Розширені можливості MongoDB",
    content: "MongoDB підтримує складні запити, агрегацію та ефективний пошук по індексах.",
    author: "Андрій Коваленко",
    date: new Date("2023-07-20")
  },
  {
    title: "Як працює стемінг",
    content: "Стемінг дозволяє скорочувати слова до їх кореня для кращого пошуку.",
    author: "Іван Петров",
    date: new Date("2023-08-10")
  }
])

// Створення текстового індексу на полях title і content
db.articles.createIndex({ "title": "text", "content": "text" })

// Пошук за словом
printjson(db.articles.find(
  { $text: { $search: "MongoDB" } }
).toArray())

// Пошук за фразою
printjson(db.articles.find(
  { $text: { $search: "\"повнотекстовий пошук\"" } }
).toArray())


// Пошук з виключенням слова
printjson(db.articles.find(
  { $text: { $search: "пошук -стемінг" } }
).toArray())

// Аналіз ефективності за допомогою explain()
stats = db.articles.find(
  { $text: { $search: "MongoDB" } }
).explain("executionStats")

print("Кількість документів, які повернув запит: ", stats.executionStats.nReturned)
print("Кількість документів, які було оглянуто (проглянуто): ", stats.executionStats.totalDocsExamined)

// mongosh example.js
