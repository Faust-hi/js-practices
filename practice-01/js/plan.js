"use strict";

const totalTasks = 14;
const completedTasks = 4;
const dailyLimit = 4;

if (
  typeof totalTasks !== "number" ||
  typeof completedTasks !== "number" ||
  typeof dailyLimit !== "number"
) {
  console.log("Ошибка: входные данные должны быть числами");
} else if (
  !Number.isFinite(totalTasks) ||
  !Number.isFinite(completedTasks) ||
  !Number.isFinite(dailyLimit)
) {
  console.log("Ошибка: недопустимое числовое значение");
} else if (
  !Number.isInteger(totalTasks) ||
  !Number.isInteger(completedTasks) ||
  !Number.isInteger(dailyLimit)
) {
  console.log("Ошибка: значения должны быть целыми числами");
} else if (totalTasks < 0) {
  console.log("Ошибка: отрицательное количество задач");
} else if (totalTasks > 1000) {
  console.log("Ошибка: превышена верхняя граница количества задач (1000)");
} else if (completedTasks < 0) {
  console.log("Ошибка: отрицательное количество выполненных задач");
} else if (completedTasks > totalTasks) {
  console.log("Ошибка: некорректное число выполненных задач");
} else if (dailyLimit < 1) {
  console.log("Ошибка: дневная норма должна быть не меньше 1");
} else if (dailyLimit > 1000) {
  console.log("Ошибка: превышена верхняя граница дневной нормы (1000)");
} else {
  let remaining = totalTasks - completedTasks;
  let day = 0;
  console.log(`Осталось задач: ${remaining}`);
  while (remaining > 0) {
    day += 1;
    const doneToday = Math.min(dailyLimit, remaining);
    remaining -= doneToday;
    console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`);
  }
  console.log(`Потребуется дней: ${day}`);
}