import { QuestionStore } from "../database/question";

export class QuestionService {

    constructor() {
        this.store = new QuestionStore();
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

    async getRandomQuestions() {
        // Get (based on given params) all uri (or uuid) in the database.

        // Pick 10 (later dynamic) random uris (or uuids).

        // Retrieve all questions for the "generated" uris (or uuids).

        // return
    }

    // async getCategory(id) {
    //     return db.getCategories
    // }
}