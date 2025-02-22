const xlsx = require('xlsx');
const path = require('path');
const axios = require('axios');

const filePath = path.resolve(__dirname, 'clientes.xlsx'); // Caminho da planilha

async function atualizarPlanilha() {
    try {
        // 1️⃣ Carregar a planilha
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Nome da aba
        const sheet = workbook.Sheets[sheetName];

        // 2️⃣ Converter para JSON
        let jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Mantendo como array para facilitar edição

        // 3️⃣ Atualizar os dados (limitando a 3 processamentos)
        let totalSucesso = 0, totalErros = 0, totalProcessados = 0;

        for (let i = 1; i <= 400; i++) { // Processando apenas as 3 primeiras linhas (além do cabeçalho)
            let cpf = jsonData[i][0]; // Supondo que o CPF esteja na primeira coluna

            if (!cpf) continue; // Ignorar linhas sem CPF

            try {
                let response = await axios.get(`http://api.dbconsultas.com/api/v1/b8c9eebb-475b-4487-a498-1bdccfceb189/cpf/${cpf}`);
                
                if (response && response.data && response.data.data) { // Corrigido para acessar os dados dentro de data.data
                    let data = response.data.data;

                    if (data.enderecos?.length > 0) {
                        if (data.enderecos[0].cep) jsonData[i][3] = data.enderecos[0].cep;
                        if (data.enderecos[0].uf) jsonData[i][6] = data.enderecos[0].uf;
                        if (data.enderecos[0].cidade) jsonData[i][7] = data.enderecos[0].cidade;
                    }

                    if(data.emails?.length > 0){
                        if(data.emails[0].email) jsonData[i][11] = data.emails[0].email;
                    }

                    if (data.telefones?.length > 0) {
                        if (data.telefones[0].telefone) jsonData[i][2] = data.telefones[0].telefone;
                    }

                    if (data.renda) jsonData[i][4] = data.renda;
                    if (data.nasc) jsonData[i][5] = data.nasc;

                    console.log(`✅ Dados atualizados na linha ${i + 1} para CPF: ${cpf}`);
                    totalSucesso++;
                } else {
                    console.log(`❌ Falha na busca de dados para CPF ${cpf}`);
                    totalErros++;
                }
            } catch (error) {
                console.log(`❌ Erro ao buscar dados para CPF ${cpf}:`, error.message);
                totalErros++;
            }

            totalProcessados++;
        }

        // 4️⃣ Converter de volta para sheet
        const newSheet = xlsx.utils.aoa_to_sheet(jsonData);

        // 5️⃣ Substituir a aba antiga pelo novo conteúdo
        workbook.Sheets[sheetName] = newSheet;

        // 6️⃣ Salvar a planilha sobrescrevendo o arquivo original
        xlsx.writeFile(workbook, filePath);

        console.log(`✅ Planilha atualizada! Sucesso: ${totalSucesso}, Erros: ${totalErros}, Total processado: ${totalProcessados}`);
    } catch (error) {   
        console.error('❌ Erro ao atualizar a planilha:', error.message);
    }
}

// Executa a função
atualizarPlanilha();
