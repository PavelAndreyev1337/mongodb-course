// Приклад модифікації банківських рахунків, використовуючи транзакції
const db = connect("mongodb://localhost:27017/lb7");

db.accounts.drop()

db.accounts.insertMany([
  { accountId: 1, owner: "Іван", balance: 1000 },
  { accountId: 2, owner: "Олена", balance: 500 }
])

const session = db.getMongo().startSession()
session.startTransaction()

try {
  // Зменшуємо баланс відправника
  db.accounts.updateOne(
    { accountId: 1, balance: { $gte: 200 } },
    { $inc: { balance: -200 } },
    { session }
  )

  // Збільшуємо баланс отримувача
  db.accounts.updateOne(
    { accountId: 2 },
    { $inc: { balance: 200 } },
    { session }
  )

  // Фіксуємо транзакцію
  session.commitTransaction()
  print("Транзакція успішно виконана.")
} catch(e) {
  print("Помилка у транзакції, виконуємо відкат: ", e)
  session.abortTransaction()
} finally {
  session.endSession()
}

// mongosh example.js 
