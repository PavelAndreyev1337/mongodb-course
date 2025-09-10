// Users — користувачі (1-1 зв’язок з Profile)

// Profiles — профілі користувачів (1-1 зі Users)

// Posts — пости користувачів (1-N: один користувач — багато постів)

// Tags — теги, які можуть мати багато постів і пости можуть мати багато тегів (N-M зв’язок між Posts і Tags)

//Переключаємось на потрібну базу (створиться автоматично при першій вставці)
// як use myDatabase
const db = connect("mongodb://localhost:27017/myDatabase");

// Очистимо колекції, якщо вже існують
db.Users.drop()
db.Profiles.drop()
db.Posts.drop()
db.Tags.drop()
db.PostsView.drop()

// === 1-1: Users - Profiles ===

const userId = ObjectId()
db.Users.insertOne({
  _id: userId,
  name: "Alice",
  email: "alice@example.com"
})

db.Profiles.insertOne({
  userId: userId,
  bio: "Hello! I am Alice",
  age: 25
})

// === 1-N: Users - Posts ===
// === N-M: Posts - Tags (вбудовані теги) ===

const post1Id = ObjectId()
const post2Id = ObjectId()

db.Posts.insertMany([
  {
    _id: post1Id,
    userId: userId,
    title: "Post 1",
    content: "Content 1",
    tags: [
      { name: "Tech" },
      { name: "Programming" }
    ]
  },
  {
    _id: post2Id,
    userId: userId,
    title: "Post 2",
    content: "Content 2",
    tags: [
      { name: "News" }
    ]
  }
])

// === View: PostsView з користувачами ===

db.createView("PostsView", "Posts", [
  {
    $lookup: {
      from: "Users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },
  { $unwind: "$user" }
])


// === Перевірка виводу view ===

printjson(db.PostsView.find().toArray());

// mongosh example.js 
// OUTPUT 
// [
//   {
//     _id: ObjectId('68c1bb57f5a32408f973518b'),
//     userId: ObjectId('68c1bb57f5a32408f9735189'),
//     title: 'Post 1',
//     content: 'Content 1',
//     tags: [
//       {
//         name: 'Tech'
//       },
//       {
//         name: 'Programming'
//       }
//     ],
//     user: {
//       _id: ObjectId('68c1bb57f5a32408f9735189'),
//       name: 'Alice',
//       email: 'alice@example.com'
//     }
//   },
//   {
//     _id: ObjectId('68c1bb57f5a32408f973518c'),
//     userId: ObjectId('68c1bb57f5a32408f9735189'),
//     title: 'Post 2',
//     content: 'Content 2',
//     tags: [
//       {
//         name: 'News'
//       }
//     ],
//     user: {
//       _id: ObjectId('68c1bb57f5a32408f9735189'),
//       name: 'Alice',
//       email: 'alice@example.com'
//     }
//   }
// ]