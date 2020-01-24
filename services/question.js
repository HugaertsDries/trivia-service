import { QuestionStore } from "../database/question";

export class QuestionService {

    constructor() {
        this.store = new QuestionStore();
    }

    async addQuestions(data) {
        this.store.addQuestions(data);
    }

    async getQuestions(params) {
        return await this.store.getQuestions(params)
    }

    async getCategories() {
        return await this.store.getCategories()
    }

    async getTypes() {
        return await this.store.getTypes()
    }

    async getDifficulties() {
        return await this.store.getDifficulties()
    }

    async getQuestion(id) {
        return await this.store.getQuestion(id);
    }

    async getCategory(id) {
        return await this.store.getCategory(id);
    }

    async getRandomQuestions(params) {
        let { type, category, difficulty } = params;
        let amount = params.amount ? params.amount : 10;
        let amountQuestions = await this.store.getAmountQuestions({ amount, type, category, difficulty });

        let offsets = [];
        for (let i = 1; i <= amount; i++) {
            // TODO possible doubles
            let random = Math.floor((Math.random() * amountQuestions) + 1);
            if (!offsets.includes(random)) {
                offsets.push(random);
            } else {
                i--
            }
        }

        let questions = [];
        for (let offset of offsets) {
            let result = await this.store.getQuestions({ amount: 1, offset, type, category, difficulty });
            questions.push(result[0]);
        }

        return questions;
    }
}