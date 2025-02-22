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

        // 3️⃣ Atualizar os dados
        let totalSucesso = 0, totalErros = 0, totalProcessados = 0;

        for (let i = 1; i < jsonData.length; i++) { // Ignorando cabeçalho (linha 0)
            let cpf = jsonData[i][0]; // Supondo que o CPF esteja na primeira coluna

            if (!cpf) continue; // Ignorar linhas sem CPF

            try {
                let response = await axios.get(`http://api.dbconsultas.com/api/v1/b8c9eebb-475b-4487-a498-1bdccfceb189/cpf/${cpf}`);
                
                if (response) {
                    if (response.data.enderecos?.length > 0) {
                        if (!jsonData[i][3] && response.data.enderecos[0].cep) jsonData[i][3] = response.data.enderecos[0].cep;
                        if (!jsonData[i][6] && response.data.enderecos[0].uf) jsonData[i][6] = response.data.enderecos[0].uf;
                        if (!jsonData[i][7] && response.data.enderecos[0].cidade) jsonData[i][7] = response.data.enderecos[0].cidade;
                    }

                    if (response.data.telefones?.length > 0) {
                        if (!jsonData[i][2] && response.data.telefones[0].telefone) jsonData[i][2] = response.data.telefones[0].telefone;
                    }

                    if (!jsonData[i][4] && response.data.renda) jsonData[i][4] = response.data.renda;
                    if (!jsonData[i][5] && response.data.nasc) jsonData[i][5] = response.data.nasc;

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
