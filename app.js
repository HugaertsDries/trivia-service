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

// GET random trivia
app.get('/trivia', function (req, res) {
    getTrivia(10, "boolean", "", "").then((data) => {
        let trivia = data.results.find((trivia) => trivia.correct_answer = "True");
        res.send(triviaSerializer.serialize(trivia));
    });
});

// GET Questions
app.get('/question', function (req, res) {
    let { amount, type, difficulty, category } = req.query
    getTrivia(amount, type, difficulty, category).then((data) => {
        data.results.forEach(((question) => question.id = uuid()));
        var questions = triviaSerializer.serialize(data.results);
        res.send(questions);
    });
});

// GET Categories
app.get('/question/category', function (req, res) {
    getCategories().then((data) => {
        var categories = categorySerializer.serialize(data.trivia_categories);
        res.send(categories);
    });
});

// GET Categories for id
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