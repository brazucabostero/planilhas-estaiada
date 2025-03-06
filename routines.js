const mongoose = require('mongoose');
const axios = require('axios');
const xlsx = require('xlsx');
const path = require('path');

function routines() {
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
    const idEventos = [74199,73230,78933,76048,73480,76293,73732,77789,79543,79237,78954,71430,77405,77857,75419,79539,77858,75033];
    const nomeEvento = function (eventoNome, idEvento) {
        switch (eventoNome) {
            case "JAMMIL - no pôr do Sol":
                return "jammilNoPorDoSol";
            case "Pagode do Adame convida PIXOTE - SP":
                return "pagodeDoAdameConvidaPixoteSp";
            case "POXTO Santa Teresa - Vou Pro Sereno":
                return "poxtoSantaTeresaVouProSereno";
            case "TRANQUILIZE por Planta & Raiz":
                return "tranquilizePorPlantaERaiz";
            case "Me Atende SP - Matheus Fernandes":
                return "meAtendeSpMatheusFernandes";
            case "CARNAVARANDA":
                return "carnavaranda";
            case "SER":
                return "ser";
            case "Batom de Cerveja - Israel e Rodolffo":
                return "batomDeCervejaIsraelERodolffo";
            case "Ressaca CARNAVARANDA - Chiclete com Banana":
                return "ressacaCarnavarandaChicleteComBanana";
            case "Terraço do Amor com FICACOMIGO":
                return "terracoDoAmorComFicaComigo";
            case "Violada Mix":
                return "violadaMix";
            case "Vai Que Cola apresenta VITINHO":
                return "vaiQueColaApresentaVitinho";
            case "Israel e Rodolffo no Boteco do Varanda":
                return "israelERodolffoNoBotecoDoVaranda";
            case "Bloquinhos no CARNAVARANDA - Amor de Carnaval":
                return "bloquinhosNoCarnavarandaAmorDeCarnaval";
            case "SER - Marcos & Belutti":
                return "serMarcosEBelutti";
            case "Axezin SP":
                return "axezinSp";
            case "Réveillon Estaiada":
                return "reveillonEstaiada";
            case "Poxto Santa Tereza 2º edição":
                return "poxtoSantaTereza2Edicao";
            default:
                return `eventoDesconhecidoVerificarId${idEvento}`;
        }
    };

    async function buscaEventosIngresse(idEvento) {
        try {
            const response = await axios.get(`https://event.ingresse.com/public/${idEvento}`);
            return response.data.data.title;
        } catch (error) {
            console.log(`Erro ao buscar evento ${idEvento}:`, error.message);
            return null;
        }
    }
    
    function validarCelular(numero) {
        const regex = /^[1-9]{2}9\d{8}$/;
        return regex.test(numero);
      }

    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
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
    this.popularMongoDB = function() {
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
    }

    this.atualizarClientes = async function() {
    try {
        const clientes = await Cliente.find();
        console.log(`🔍 Encontrados ${clientes.length} clientes para validar.`);

        let atualizados = 0, erros = 0;

        for (const cliente of clientes) {
            if (!validarCPF(cliente.cpf)) {
                console.log(`⚠️ CPF inválido ignorado: ${cliente.cpf}`);
                continue;
            }

            try {
                const response = await axios.get(`http://api.dbconsultas.com/api/v1/6b63d355-14cd-4acc-b547-26ccedd8999c/cpf/${cliente.cpf}`);
                const data = response.data.data;
            debugger;
                const novoNome = data.nome || cliente.nome;
                const novoEmail = Array.isArray(data.emails) && data.emails.length > 0 ? data.emails[0].email : cliente.email;
                
                const novoTelefone = (Array.isArray(data.telefones) && data.telefones.length > 0 ? data.telefones[0].telefone : null) ?? cliente.telefone;

                // Atualizar o cliente no banco se houver mudanças
                await Cliente.updateOne({ _id: cliente._id }, { nome: novoNome, email: novoEmail, telefone: novoTelefone });

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

    this.corrigirTelefone = async function() {
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



    this.tagsIngresse = function(){
        function readExcel(filePath) {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
            return jsonData.slice(1).map(row => ({
                idEvento: row[0],
                nome: row[1],
                email: row[2],
                telefone: row[3],
            }));
        }
        async function atualizaClientes(data) {
            try {
                for (const item of data) {
                    const capturaNomeEvento = await buscaEventosIngresse(item.idEvento);
                    if (!capturaNomeEvento) {
                        console.log(`Nome do evento não encontrado para ID ${item.idEvento}`);
                        continue;
                    }
        
                    const tagEvento = nomeEvento(capturaNomeEvento, item.idEvento);
                    const tagCompleta = `${tagEvento}, compra-ingresse`;
        
                    const cliente = await Cliente.findOne({
                        $or: [{ nome: item.nome.toUpperCase() }, { email: item.email }, { telefone: item.telefone }],
                    });
        
                    if (cliente) {
                        cliente.tag = tagCompleta
                        await cliente.save();
                        console.log(`Cliente atualizado: ${cliente.nome}`);
                    } else {
                        await Cliente.create({
                            nome: item.nome,
                            email: item.email,
                            telefone: item.telefone,
                            tag: tagCompleta,
                        });
                        console.log(`Novo cliente inserido: ${item.nome}`);
                    }
                }
            } catch (err) {
                console.error("Erro ao inserir dados no MongoDB", err);
            } finally {
                mongoose.connection.close();
            }
        }
        
        async function tagsIngresse() {
            const filePath = path.resolve(__dirname, "ingresse.xlsx");
            const data = readExcel(filePath);
            await atualizaClientes(data);
        }
        
        tagsIngresse();
    }

    this.run = function(){
        setInterval(() => {
            console.log('Running...'); 
        }, 5000);
        
    }
}

module.exports = routines;