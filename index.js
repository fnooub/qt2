const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();

const { Dictionary } = require('./Dictionary');

const dictionary = new Dictionary();
dictionary.init().then(() => {
    console.log('Từ điển tải thành công');
}).catch((error) => {
    console.error('Lỗi khi tải từ điển:', error);
});

app.use(cors()); // Kích hoạt middleware CORS
app.use(bodyParser.json());
app.post('/translate', async (req, res) => {
    try {
        const text = req.body.text || '';
        let isEditMode = false;
        let isSingleMode = false;

        if (req.body.type === 'edit') {
            isEditMode = true;
        } else if (req.body.type === 'single') {
            isSingleMode = true;
        }

        const translateText = async (inputText) => {
            let translation;
            let phienAm = [];
            let weights = 0;

            const searchResult = dictionary.search(inputText);

            if (searchResult) {
                translation = searchResult;
                phienAm = inputText.split('').map(char => dictionary.phienAmDictionary.get(char));
                weights = 1;
            } else {
                const phienAmResult = dictionary.phienAmDictionary.get(inputText);

                if (phienAmResult) {
                    translation = phienAmResult;
                    phienAm = [phienAmResult];
                    weights = 2;
                } else {
                    translation = inputText;
                    phienAm = inputText.split('').map(char => dictionary.phienAmDictionary.get(char));
                    weights = 0;
                }
            }

            return [inputText, translation, phienAm.join(' '), weights];
        };

        let translatedText;

        if (isEditMode) {
            const splitText = dictionary.tokenize(text);
            translatedText = await Promise.all(splitText.map(word => translateText(word)));
        } else if (isSingleMode) {
            translatedText = await translateText(text);
        } else {
            translatedText = await dictionary.translate(text);
        }

        res.json(translatedText);

    } catch (error) {
        console.error('Lỗi dịch:', error);
        res.status(500).json({ error: 'Lỗi dịch' });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Máy chủ đang chạy trên cổng ${PORT}`);
});
