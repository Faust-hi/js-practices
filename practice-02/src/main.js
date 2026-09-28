import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";
import { searchTasks } from "./task-extra.js";

function printTasks(tasks) {
  console.table(
    tasks.map(({ id, title, completed, priority }) => ({ id, title, completed, priority })),
  );
}
function printStats(tasks, label) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  if (total === 0) {
    console.log(`${label} Задач пока нет`);
    return;
  }
  console.log(
    `${label} Всего: ${total}; выполнено: ${completed}; осталось: ${pending}; прогресс: ${progress.toFixed(1)}%`,
  );
}
console.log("=== Общий сценарий (demoTasks) ===");
console.log("Исходные задачи:");
printTasks(demoTasks);
console.log("Названия:", getTaskTitles(demoTasks).join(" | "));
console.log("Невыполненные задачи:");
printTasks(getPendingTasks(demoTasks));
printStats(demoTasks, "Сводка исходного набора:");
let currentTasks = demoTasks;
const addResult = addTask(currentTasks, 20, "Добавить проверку", "high");
if (addResult.ok) currentTasks = addResult.tasks;
else console.error(`Ошибка: ${addResult.error}`);
printStats(currentTasks, "После добавления id 20:");
const completionResult = setTaskCompleted(currentTasks, 4, true);
if (completionResult.ok) currentTasks = completionResult.tasks;
else console.error(`Ошибка: ${completionResult.error}`);
printStats(currentTasks, "После установки completed = true для id 4:");
const renameResult = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (renameResult.ok) currentTasks = renameResult.tasks;
else console.error(`Ошибка: ${renameResult.error}`);
printStats(currentTasks, "После переименования id 10:");
const removeResult = removeTask(currentTasks, 7);
if (removeResult.ok) currentTasks = removeResult.tasks;
else console.error(`Ошибка: ${removeResult.error}`);
printStats(currentTasks, "После удаления id 7:");
console.log("Обработка отказа: попытка повторно добавить существующий id 20.");
const duplicateResult = addTask(currentTasks, 20, "Повторная задача", "low");
if (duplicateResult.ok) currentTasks = duplicateResult.tasks;
else console.error(`Ошибка: ${duplicateResult.error}`);
printStats(currentTasks, "Состояние после отклонённой операции:");
console.log("Итоговый список задач:");
printTasks(currentTasks);
console.log(
  "Исходный demoTasks после всех операций:",
  JSON.stringify(demoTasks.map(({ id, title, completed, priority }) => ({ id, title, completed, priority }))),
);
console.log("");
console.log(`=== Индивидуальный сценарий (вариант ${variantNumber}: оформление технической документации) ===`);
console.log("Исходные задачи варианта:");
printTasks(variantTasks);
printStats(variantTasks, "Сводка исходного набора варианта:");
let variantCurrent = variantTasks;
const addVariantResult = addTask(variantCurrent, 80, "Собрать замечания рецензентов", "low");
if (addVariantResult.ok) variantCurrent = addVariantResult.tasks;
else console.error(`Ошибка: ${addVariantResult.error}`);
printStats(variantCurrent, "После добавления id 80:");
const completionVariantResult = setTaskCompleted(variantCurrent, 11, true);
if (completionVariantResult.ok) variantCurrent = completionVariantResult.tasks;
else console.error(`Ошибка: ${completionVariantResult.error}`);
printStats(variantCurrent, "После установки completed = true для id 11 (уже была выполнена):");
const renameVariantResult = renameTask(variantCurrent, 23, "Актуализировать раздел требований");
if (renameVariantResult.ok) variantCurrent = renameVariantResult.tasks;
else console.error(`Ошибка: ${renameVariantResult.error}`);
printStats(variantCurrent, "После переименования id 23:");
const removeVariantResult = removeTask(variantCurrent, 37);
if (removeVariantResult.ok) variantCurrent = removeVariantResult.tasks;
else console.error(`Ошибка: ${removeVariantResult.error}`);
printStats(variantCurrent, "После удаления id 37:");
console.log("Обработка отказа: попытка повторно добавить существующий id 80.");
const duplicateVariantResult = addTask(variantCurrent, 80, "Дубликат задачи", "high");
if (duplicateVariantResult.ok) variantCurrent = duplicateVariantResult.tasks;
else console.error(`Ошибка: ${duplicateVariantResult.error}`);
printStats(variantCurrent, "Состояние после отклонённой операции:");
console.log("Итоговый список задач варианта:");
printTasks(variantCurrent);
console.log("Итоговые идентификаторы:", variantCurrent.map((task) => task.id).join(", "));
console.log(
  "Исходный variantTasks после всех операций:",
  JSON.stringify(variantTasks.map(({ id, title, completed, priority }) => ({ id, title, completed, priority }))),
);
console.log("");
console.log("=== Расширение: поиск ===");
console.log("Поиск ' ФУНК ':", searchTasks(demoTasks, " ФУНК ").map((t) => t.id).join(", "));
console.log("Поиск 'несуществующий фрагмент':", searchTasks(demoTasks, "несуществующий фрагмент").length);

// TODO: после реализации функций выполнить общий сценарий из раздела 6.5.
// Текущее состояние хранится в локальной переменной:
// let currentTasks = demoTasks;
// После успешной операции currentTasks получает result.tasks.
// При result.ok === false необходимо вывести ошибку, не заменяя состояние.
// Сводка выводится после каждого этапа; вычисления выполняются в task-service.js.

// TODO: выполнить отдельный сценарий для variantTasks по разделу 7.
// Общий набор demoTasks не заменяется данными варианта.

// TODO: показать хотя бы одну обработанную ошибку и неизменность исходных данных.
// Для удобного вывода объектов допустимо использовать console.table().
