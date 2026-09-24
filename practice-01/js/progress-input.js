"use strict";

const totalTasksInput = "14";
const completedTasksInput = "4";

function parseTaskCount(value, label) {
  if (typeof value !== "string") {
    return { ok: false, error: `Ошибка: ${label} должно быть строкой` };
  }
  const cleanedValue = value.trim();
  if (cleanedValue === "") {
    return { ok: false, error: `Ошибка: ${label} не может быть пустым` };
  }
  const numberValue = Number(cleanedValue);
  if (!Number.isFinite(numberValue)) {
    return { ok: false, error: `Ошибка: ${label} содержит недопустимое число` };
  }
  if (!Number.isInteger(numberValue)) {
    return { ok: false, error: `Ошибка: ${label} должно быть целым числом` };
  }
  return { ok: true, value: numberValue };
}

const parsedTotal = parseTaskCount(totalTasksInput, "Количество задач");
const parsedCompleted = parseTaskCount(completedTasksInput, "Количество выполненных задач");

if (!parsedTotal.ok) {
  console.log(parsedTotal.error);
} else if (!parsedCompleted.ok) {
  console.log(parsedCompleted.error);
} else {
  const totalTasks = parsedTotal.value;
  const completedTasks = parsedCompleted.value;
  if (totalTasks < 0) {
    console.log("Ошибка: отрицательное количество задач");
  } else if (totalTasks > 1000) {
    console.log("Ошибка: превышена верхняя граница количества задач (1000)");
  } else if (completedTasks < 0) {
    console.log("Ошибка: отрицательное количество выполненных задач");
  } else if (completedTasks > totalTasks) {
    console.log("Ошибка: выполнено больше, чем существует");
  } else if (totalTasks === 0 && completedTasks === 0) {
    console.log("Задач пока нет");
  } else {
    const remainingTasks = totalTasks - completedTasks;
    const progress = (completedTasks / totalTasks) * 100;
    let status;
    if (completedTasks === 0) status = "Не начато";
    else if (completedTasks === totalTasks) status = "Завершено";
    else status = "В работе";
    console.log(`Всего задач: ${totalTasks}`);
    console.log(`Выполнено: ${completedTasks}`);
    console.log(`Осталось: ${remainingTasks}`);
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
    console.log(`Статус: ${status}`);
  }
}