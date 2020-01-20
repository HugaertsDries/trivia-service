import { app, uuid, errorHandler } from "mu";
import fetch from "node-fetch";
import { Serializer } from "jsonapi-serializer";

const QUESTION = {
    AMOUNT: 50,
    TYPE: "",
    DIFFICULTY: "",
    CATEGORY: ""
}

const categorySerializer = new Serializer('category', {
    attributes: ["name"]
});

const triviaSerializer = new Serializer('question', {
    attributes: ["category", "difficulty", "question", "correct_answer", "incorrect_answers"]
});


app.get('/question', function (req, res) {
    let { amount, type, difficulty, category } = req.query
    getTrivia(amount, type, difficulty, category).then((data) => {
        data.results.forEach(((question) => question.id = uuid()));
        var questions = triviaSerializer.serialize(data.results);
        res.send(questions);
    });
});

app.get('/question/category', function (req, res) {
    getCategories().then((data) => {
        var categories = categorySerializer.serialize(data.trivia_categories);
        res.send(categories);
    });
});

app.get('/question/category/:categoryId', function (req, res) {
    getCategories().then((data) => {
        let cat = categorySerializer.serialize(
            data.trivia_categories.filter(cat => cat.id == req.params.categoryId)
        );
        res.send(cat);
    });
});

async function getTrivia(amount, type, difficulty, category) {
    let amt = amount ? amount : QUESTION.AMOUNT;
    let typ = type ? type : QUESTION.TYPE;
    let dif = difficulty ? difficulty : QUESTION.DIFFICULTY;
    let cat = category ? category : QUESTION.CATEGORY;
    return await fetch(`https://opentdb.com/api.php?amount=${amt}&type=${typ}&difficulty=${dif}&category=${cat}`)
        .then((response) => response.json());
}

async function getCategories() {
    return await fetch('https://opentdb.com/api_category.php')
        .then((response) => response.json());
}

app.use(errorHandler);