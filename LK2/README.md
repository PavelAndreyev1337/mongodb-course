# Лекція 2: Моделювання даних

## Представлення (Views)

Представлення MongoDB — це об'єкт лише для читання, до якого можна робити запити, вміст якого визначається **конвеєром агрегації** в інших колекціях або представленнях.
MongoDB не зберігає вміст представлення на диску. Вміст представлення обчислюється на вимогу, коли клієнт запитує представлення.

MongoDB пропонує два різних типи представлень: стандартні представлення та матеріалізовані представлення на вимогу. Обидва типи представлень повертають результати з конвеєра агрегації.
* Стандартні представлення обчислюються під час зчитування представлення та не зберігаються на диску. 
* Матеріалізовані представлення на вимогу зберігаються на диску та зчитуються з нього. Вони використовують етап **$merge** або **$out** для оновлення збережених даних.

Поки що розглянемо тільки стандартні представлення.

**db.createCollection()** синтаксис:
```
db.createCollection(
  "<viewName>",
  {
    "viewOn" : "<source>",
    "pipeline" : [<pipeline>],
    "collation" : { <collation> }
  }
)
```

```db.createView()``` синтаксис:
```
db.createView(
  "<viewName>",
  "<source>",
  [<pipeline>],
  {
    "collation" : { <collation> }
  }
)
```

Додатковий параметр **collation** визначає порядок сортування.

### Приклад

Заповнення колекції:

``` 
db.students.insertMany( [
   { sID: 22001, name: "Alex", year: 1, score: 4.0 },
   { sID: 21001, name: "bernie", year: 2, score: 3.7 },
   { sID: 20010, name: "Chris", year: 3, score: 2.5 },
   { sID: 22021, name: "Drew", year: 1, score: 3.2 },
   { sID: 17301, name: "harley", year: 6, score: 3.1 },
   { sID: 21022, name: "Farmer", year: 1, score: 2.2 },
   { sID: 20020, name: "george", year: 3, score: 2.8 },
   { sID: 18020, name: "Harley", year: 5, score: 2.8 },
] ) 
```

Створення представлення

```
db.createView(
   "firstYears",
   "students",
   [ { $match: { year: 1 } } ]
)
```

Запит представлення

```
db.firstYears.find({}, { _id: 0 } )
```

Вихідні дані містять лише документи з даними про студентів першого курсу

```
[
  { sID: 22001, name: 'Alex', year: 1, score: 4 },
  { sID: 22021, name: 'Drew', year: 1, score: 3.2 },
  { sID: 21022, name: 'Farmer', year: 1, score: 2.2 }
]
```


### Використання представлення для об'єднання двох колекцій

Створення двох колекцій

```
db.inventory.insertMany( [
   { prodId: 100, price: 20, quantity: 125 },
   { prodId: 101, price: 10, quantity: 234 },
   { prodId: 102, price: 15, quantity: 432 },
   { prodId: 103, price: 17, quantity: 320 }
] )
db.orders.insertMany( [
   { orderId: 201, custid: 301, prodId: 100, numPurchased: 20 },
   { orderId: 202, custid: 302, prodId: 101, numPurchased: 10 },
   { orderId: 203, custid: 303, prodId: 102, numPurchased: 5 },
   { orderId: 204, custid: 303, prodId: 103, numPurchased: 15 },
   { orderId: 205, custid: 303, prodId: 103, numPurchased: 20 },
   { orderId: 206, custid: 302, prodId: 102, numPurchased: 1 },
   { orderId: 207, custid: 302, prodId: 101, numPurchased: 5 },
   { orderId: 208, custid: 301, prodId: 100, numPurchased: 10 },
   { orderId: 209, custid: 303, prodId: 103, numPurchased: 30 }
] )
```

Створення об'єднаного представлення (Joined View)

```
db.createView( "sales", "orders", [
   {
      $lookup:
         {
            from: "inventory",
            localField: "prodId",
            foreignField: "prodId",
            as: "inventoryDocs"
         }
   },
   {
      $project:
         {
           _id: 0,
           prodId: 1,
           orderId: 1,
           numPurchased: 1,
           price: "$inventoryDocs.price"
         }
   },
      { $unwind: "$price" }
] )
```

* Етап **$lookup** використовує поле **prodId** у колекції замовлень для "об'єднання" документів.
* Відповідні документи додаються як масив у поле **inventoryDocs**.
* Етап **$project** вибирає підмножину доступних полів.
* Етап **$unwind** перетворює поле ціни з масиву на скалярне значення.

Документи у представленні **sales**
```
{ orderId: 201, prodId: 100, numPurchased: 20, price: 20 },
{ orderId: 202, prodId: 101, numPurchased: 10, price: 10 },
{ orderId: 203, prodId: 102, numPurchased: 5, price: 15 },
{ orderId: 204, prodId: 103, numPurchased: 15, price: 17 },
{ orderId: 205, prodId: 103, numPurchased: 20, price: 17 },
{ orderId: 206, prodId: 102, numPurchased: 1, price: 15 },
{ orderId: 207, prodId: 101, numPurchased: 5, price: 10 },
{ orderId: 208, prodId: 100, numPurchased: 10, price: 20 },
{ orderId: 209, prodId: 103, numPurchased: 30, price: 17 }
```


### Створення представлення зі стандартним сортуванням (View with Default Collation)

Collation дозволяє вказати специфічні для мови правила порівняння рядків, такі як правила для регістру літер та знаків наголосу.

Створення колекції

```
db.places.insertMany([
   { _id: 1, category: "café" },
   { _id: 2, category: "cafe" },
   { _id: 3, category: "cafE" }
])
```

Наступна операція створює представлення, вказуючи сортування на рівні представлення

```
db.createView(
   "placesView",
   "places",
   [ { $project: { category: 1 } } ],
   { collation: { locale: "fr", strength: 1 } }
)
```
Наступна операція використовує сортування представлення:

```
db.placesView.countDocuments( { category: "cafe" } )
```

Операція повертає **3**.

### Зміна або видалення представлення

Щоб видалити представлення, скористайтеся методом ** db.collection.drop() ** для представлення.
Щоб змінити представлення, ви можете: 
* Видалити та створити представлення заново. 
* Використати команду collMod.

Приклад

Розглянемо наступне представлення з назвою **lowStock**:

```
db.createView(
   "lowStock",
   "products",
   [ { $match: { quantity: { $lte: 20 } } } ]
)
```

```
db.runCommand( {
   collMod: "lowStock",
   viewOn: "products",
   "pipeline": [ { $match: { quantity: { $lte: 10 } } } ]
} )
```

## Обмежені колекції (Capped Collections)

Обмежені колекції – це колекції фіксованого розміру, які додають та отримують документи на основі порядку вставки. Обмежені колекції працюють подібно до циклічних буферів: як тільки колекція заповнює виділений простір, вона звільняє місце для нових документів, перезаписуючи найстаріші документи в колекції.

Приклад команди

``` 
db.createCollection( "log", { capped: true, size: 100000 } )
```

### Кластерні колекції (Clustered Collections)

Кластерні колекції (починаючи з 5.3) зберігають індексовані документи в тому ж файлі WiredTiger (storage engine), що й специфікація індексу. Зберігання документів колекції та індексу в одному файлі забезпечує переваги для зберігання та продуктивності порівняно зі звичайними індексами.

Кластерні колекції створюються за допомогою кластерного індексу. Кластерний індекс визначає порядок, у якому зберігаються документи.

Приклад 

```
db.createCollection(
   "stocks",
   { clusteredIndex: { "key": { _id: 1 }, "unique": true, "name": "stocks clustered key" } }
)
```

* **"key": { _id: 1 }**, який встановлює ключ кластерного індексу в поле **_id**.
* **"unique": true**, що вказує на те, що значення ключа кластерного індексу має бути унікальним.
* **"name": "stocks clustered key"**, який встановлює ім'я кластерного індексу.

## Моделювання даних (Data Modeling)
