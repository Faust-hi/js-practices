"use strict";

console.log('1) "8" + 2 ->', "8" + 2, "- тип:", typeof ("8" + 2));
console.log('2) "8" - 2 ->', "8" - 2, "- тип:", typeof ("8" - 2));
console.log('3) Number("8") + 2 ->', Number("8") + 2, "- тип:", typeof (Number("8") + 2));
console.log('4) "12" > "3" ->', "12" > "3", "- тип:", typeof ("12" > "3"));
console.log('5) 12 === "12" ->', 12 === "12", "- тип:", typeof (12 === "12"));
console.log('6) Number("") ->', Number(""), "- тип:", typeof Number(""));
console.log('7) Number("text") ->', Number("text"), "- тип:", typeof Number("text"));
console.log('8) Boolean("false") ->', Boolean("false"), "- тип:", typeof Boolean("false"));
console.log("9) typeof null ->", typeof null, "- тип результата:", typeof (typeof null));
console.log("10) typeof NaN ->", typeof NaN, "- тип результата:", typeof (typeof NaN));