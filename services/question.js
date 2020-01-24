import { uuid } from "mu";
import { OpenTDBService } from "./services/opentdb";

export class QuestionService {

    constructor() {
        db = new QuestionDB();
    }

    async getQuestions(params) {
        return db.getQuestions(params)
    }

    async getCategories() {
        return db.getCategories()
    }

    async getCategory(id) {
        return db.getCategories
    }
}