const xlsx = require('xlsx');
const mongoose = require('mongoose');
const path = require('path');

mongoose.connect('mongodb+srv://matheuses23:i9OrluvsEFqvZH3Z@database-varanda.7mjui.mongodb.net/?retryWrites=true&w=majority&appName=Database-Varanda', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB');
}).catch(err => {
    console.error('Erro ao conectar ao MongoDB', err);
});

const clienteSchema = new mongoose.Schema({
    cpf: String,
    nome: String,
    email: String,
    telefone: String,
    tag: String,
    score: String,
});

const Cliente = mongoose.model('Cliente', clienteSchema);

function readExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    return jsonData.slice(1).map(row => ({
        cpf: row[0],
        nome: row[1],
        telefone: row[2],
        email: row[3],
        tag: row[4],
        score: row[5],
    }));
}

async function populateMongo(data) {
    try {
        const result = await Cliente.insertMany(data);
        console.log(`${result.length} documentos inseridos`);
    } catch (err) {
        console.error('Erro ao inserir dados no MongoDB', err);
    } finally {
        mongoose.connection.close();
    }
}

const filePath = path.resolve(__dirname, 'clientes.xlsx');

const data = readExcel(filePath);
populateMongo(data);