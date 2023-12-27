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

app.post('/translate', (req, res) => {
    try {
        const text = req.body.text || '';
        let isEditMode = false;

        // Kiểm tra xem có thuộc tính 'type' trong yêu cầu không
        if (req.body.type === 'edit') {
            isEditMode = true;
        }

        let translatedText;

        if (isEditMode) {
            const splitText = dictionary.tokenize(text);

            translatedText = splitText.map(word => {
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
                return [word, translation, phienAm.join(' ')];
            });
        } else {
            translatedText = dictionary.translate(text);
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
