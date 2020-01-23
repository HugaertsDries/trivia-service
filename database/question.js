import { query, update } from 'mu';
import uuidv5 from 'uuid/v5';

const PREFIX_QUESTIONS = "http://qmino/data/questions/";
const PREFIX_PRE_EXT = "http://qmino/vocabularies/ext/";
const PREFIX_PRE_CORE = "http://qmino/vocabularies/core/";

const NAMESPACE = "7d96e81d-bfad-4e08-b820-1d5ff04b1972";

export class QuestionDB {

    addQuestion(question) {
        let uuid = uuidv5(question.question, NAMESPACE);
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>

        INSERT DATA {
            GRAPH <http://mu.semte.ch/application> { 
                <${PREFIX_QUESTIONS}${uuid}> 
                    rdf:type ve:Trivia ; 
                    vc:uuid "${uuid}" ;
                    ve:category "${question.category}" ;
                    ve:type "${question.type}" ;
                    ve:difficulty "${question.difficulty}" ;
                    ve:question "${question.question}" ;
                    ve:correct_answer "${question.correct_answer}"
            }
        }
        `
        update(q);
        return uuid;
    }

    addQuestions(questions) {
        questions.forEach(question => {
            this.addQuestion(question);
        });
    }

    async getQuestion(uuid) {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT ?uri ?id ?category ?type ?difficulty ?question ?correct_answer
        WHERE {
            GRAPH <http://mu.semte.ch/application> {
                ?uri rdf:type ve:Trivia . 
                ?uri vc:uuid "${uuid}" .
                ?uri vc:uuid ?id .
                ?uri ve:category ?category .
                ?uri ve:type ?type .
                ?uri ve:difficulty ?difficulty .
                ?uri ve:question ?question .
                ?uri ve:correct_answer ?correct_answer .
            }
        }
        `

        let res = await query(q);
        let transformed = this.transformBindingsToQuestions(res.results.bindings);
        return transformed;

    }

    async getQuestions() {
        let q = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ve: <${PREFIX_PRE_EXT}>
        PREFIX vc: <${PREFIX_PRE_CORE}>
        
        SELECT ?uri ?id ?category ?type ?difficulty ?question ?correct_answer
        WHERE {
            GRAPH <http://mu.semte.ch/application> { 
                ?uri rdf:type ve:Trivia .
                ?uri vc:uuid ?id .
                ?uri ve:category ?category .
                ?uri ve:type ?type .
                ?uri ve:difficulty ?difficulty .
                ?uri ve:question ?question .
                ?uri ve:correct_answer ?correct_answer .
            }
        }
        `

        let res = await query(q);
        let transformed = this.transformBindingsToQuestions(res.results.bindings);
        return transformed;
    }

    async getCategories() {

    }

    // TODO move this to dedicated transformation.js
    transformBindingsToQuestions(bindings) {
        return bindings.map(binding => {
            return this.transformBindingToQuestion(binding);
        })
    }

    // TODO move this to dedicated transformation.js
    transformBindingToQuestion(binding) {
        return {
            id: binding.id.value,
            category: binding.category.value,
            difficulty: binding.difficulty.value,
            question: binding.question.value,
            correct_answer: binding.correct_answer.value
        }
    }


}