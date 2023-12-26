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
        const inputText = req.body.text || '';
        const translatedText = await dictionary.translate(inputText);
        res.json({ translatedText });
    } catch (error) {
        console.error('Lỗi dịch:', error);
        res.status(500).json({ error: 'Lỗi dịch' });
    }
});

app.post('/translate/edit', async (req, res) => {
    try {
        const inputText = req.body.text || '';
        const splitText = dictionary.tokenize(inputText);

        const translatedText = splitText.map(word => {
            let translation = '';
            let phienAm = [];

            // Tìm kiếm từ trong từ điển
            const searchResult = dictionary.search(word);

            // Nếu tìm thấy, sử dụng nghĩa đầu tiên (nếu có)
            if (searchResult) {
                translation = searchResult;
                phienAm = word.split('').map(char => dictionary.phienAmDictionary.get(char));
            } else {
                // Nếu không tìm thấy, thử tìm trong từ điển phát âm
                const phienAmResult = dictionary.phienAmDictionary.get(word);

                // Nếu tìm thấy trong từ điển phát âm, sử dụng kết quả đó
                if (phienAmResult) {
                    translation = phienAmResult;
                    phienAm = [phienAmResult];
                } else {
                    // Nếu không tìm thấy ở cả hai nơi, sử dụng từ gốc
                    translation = word;
                    phienAm = [];
                }
            }

            // Trả về chuỗi "{translation} {word} {phienAm.join(' ')}"
            return {
                h: word,
                v: translation,
                hv: phienAm.join(' ')
            };
        });

        res.json({ translatedText });
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
