const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
const PORTA_WEB = 3000;

// Altere para a COM que funciona no seu computador
const portaSerial = new SerialPort({
    path: "COM9",
    baudRate: 115200
});

const parser = portaSerial.pipe(
    new ReadlineParser({ delimiter: "\n" })
);

// Esta variável será compartilhada pelas duas rotas
let ultimoDado = {
    temperatura: null,
    umidade: null,
    luminosidade: null,
    ambiente: null,
    atualizadoEm: null
};

// Recebe e armazena as leituras do ESP32
parser.on("data", (linha) => {
    try {
        const dados = JSON.parse(linha.trim());

        if (
            typeof dados.temperatura !== "number" ||
            typeof dados.umidade !== "number" ||
            typeof dados.luminosidade !== "number" ||
            typeof dados.ambiente !== "string"
        ) {
            return;
        }

        // Atualiza o objeto que a API vai devolver
        ultimoDado = {
            temperatura: dados.temperatura,
            umidade: dados.umidade,
            luminosidade: dados.luminosidade,
            ambiente: dados.ambiente,
            atualizadoEm: new Date().toISOString()
        };

        console.log("Dados armazenados:", ultimoDado);

    } catch (erro) {
        console.log("Linha serial ignorada:", linha.trim());
    }
});

portaSerial.on("error", (erro) => {
    console.error("Erro na porta USB:", erro.message);
});

// Disponibiliza os arquivos da pasta public
app.use(express.static("public"));

// API que entrega os dados armazenados
app.get("/api/dados", (req, res) => {
    res.set("Cache-Control", "no-store");
    console.log("API consultada:", ultimoDado);
    res.json(ultimoDado);
});

app.listen(PORTA_WEB, () => {
    console.log(`Site: http://localhost:${PORTA_WEB}`);
});