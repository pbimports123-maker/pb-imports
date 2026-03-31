const fs = require('fs');
const path = 'src/app/fretes/page.tsx';
let t = fs.readFileSync(path, 'utf8');
t = t.replace(/RESPECT/g,'PB');
t = t.replace(/PHARMA/g,'IMPORTS');
t = t.replace(/Respect Pharma/g,'PB Imports');
t = t.replace('Valores de envio por regiÃ£o','Valores de envio por região');
t = t.replace('Correios â€” PAC','Correios — PAC');
t = t.replace('Correios â€” SEDEX','Correios — SEDEX');
t = t.replace('Entrega especial â€” Demais regiÃµes sob consulta!','Entrega especial — Demais regiões sob consulta!');
if(!t.includes('const order = "PAC"')){
  t = t.replace('const grouped = data.reduce((acc: any, rate: any) => {','const order = ["PAC","SEDEX","Transportadoras","Fretes VIP"]\n        const grouped = data.reduce((acc: any, rate: any) => {');
}
t = t.replace('setShippingData(Object.values(grouped));','const ordered = Object.values(grouped).sort((a: any, b: any) => order.indexOf(a.title) - order.indexOf(b.title));\n        setShippingData(ordered);');
fs.writeFileSync(path, t);
console.log('done');
