db.Users.deleteMany({})


db.Users.insertMany([
    {
        name: "Ivan",
        email: "ivan@example.com"
    },
    {
        name: "Petro",
        email: "petro@example.com"
    },
    {
        name: "Alex",
        email: "alex@example.com"
    },
    {
        name: "Viktor",
        email: "Viktor@example.com"
    },
    {
        name: "Max",
        email: "max@example.com"
    },
])


printjson(db.Users.find().toArray());

printjson(db.Users.find({}) // фільтр
    .sort({ name: 1 }) )

printjson(db.Users.find({}) // фільтр
    .sort({ name: 1 })   // 1 — за зростанням, -1 — за спаданням
    .skip(3) // кількість для пропуску
    .limit(2).toArray()) // розмір сторінки


// mongosh pagination.js
// OUTPUT:
// [
//   {
//     _id: ObjectId('68cb2c0e824b7ee89b73518a'),
//     name: 'Petro',
//     email: 'petro@example.com'
//   },
//   {
//     _id: ObjectId('68cb2c0e824b7ee89b73518c'),
//     name: 'Viktor',
//     email: 'Viktor@example.com'
//   }
// ]
