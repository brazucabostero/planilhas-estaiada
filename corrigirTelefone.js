const mongoose = require('mongoose');
const axios = require('axios');

// Conectar ao MongoDB
mongoose.connect('mongodb+srv://matheuses23:i9OrluvsEFqvZH3Z@database-varanda.7mjui.mongodb.net/?retryWrites=true&w=majority&appName=Database-Varanda', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Conectado ao MongoDB');
}).catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB', err);
});

// Definição do Schema e Model
const clienteSchema = new mongoose.Schema({
    cpf: String,
    nome: String,
    email: String,
    telefone: String
});

const Cliente = mongoose.model('Cliente', clienteSchema);

// Função para validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; // Verifica sequência repetida

    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[10])) return false;

    return true;
}

function validarCelular(numero) {
    const regex = /^[1-9]{2}9\d{8}$/;
    return regex.test(numero);
  }

// Função principal
async function atualizarClientes() {
    try {
        const clientes = await Cliente.find(({telefone: '2121050000'}));
        console.log(`🔍 Encontrados ${clientes.length} clientes para corrigir telefone.`);

        let atualizados = 0, erros = 0;

        for (const cliente of clientes) {
            if (!validarCPF(cliente.cpf)) {
                console.log(`⚠️ CPF inválido ignorado: ${cliente.cpf}`);
                continue;
            }

            try {
                const response = await axios.get(`http://api.dbconsultas.com/api/v1/6b63d355-14cd-4acc-b547-26ccedd8999c/cpf/${cliente.cpf}`);
                const data = response.data.data;
                let novoTelefone;
                if (Array.isArray(data.telefones)) {
                    for (const element of data.telefones) {
                        if (validarCelular(element.telefone)) {
                            novoTelefone = element.telefone;
                            break;
                        }
                    }
                }

                await Cliente.updateOne({ _id: cliente._id }, {telefone: novoTelefone });

                console.log(`✅ Cliente atualizado: ${cliente.cpf}`);
                atualizados++;
            } catch (error) {
                console.log(`❌ Erro ao buscar dados para CPF ${cliente.cpf}:`, error.message);
                erros++;
            }
        }

        console.log(`\n🚀 Atualização concluída! ${atualizados} clientes atualizados, ${erros} erros.`);
    } catch (error) {
        console.log(error);
        console.error('❌ Erro na atualização dos clientes:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

// Executa a função
atualizarClientes();
