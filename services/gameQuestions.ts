
export type QuestionType = 'MATH' | 'ENGLISH';

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    type: QuestionType;
}

export const generateQuestion = (type: QuestionType): Question => {
    switch (type) {
        case 'MATH': return generateMathQuestion();
        case 'ENGLISH': return generateEnglishQuestion();
        default: return generateMathQuestion();
    }
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateMathQuestion = (): Question => {
    const operator = Math.random() > 0.5 ? '+' : '-';
    let a, b, result;
    
    if (operator === '+') {
        a = getRandomInt(1, 20);
        b = getRandomInt(1, 20);
        result = a + b;
    } else {
        a = getRandomInt(5, 20);
        b = getRandomInt(1, a); // ensure positive result
        result = a - b;
    }

    const correctAnswer = result.toString();
    const options = new Set<string>();
    options.add(correctAnswer);
    
    while (options.size < 3) {
        const wrong = result + getRandomInt(-5, 5);
        if (wrong >= 0 && wrong !== result) options.add(wrong.toString());
    }

    return {
        id: Math.random().toString(),
        text: `${a} ${operator} ${b} = ?`,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer,
        type: 'MATH'
    };
};

const englishWords = [
    { cs: 'Pes', en: 'Dog' }, { cs: 'Kočka', en: 'Cat' }, { cs: 'Jablko', en: 'Apple' },
    { cs: 'Auto', en: 'Car' }, { cs: 'Dům', en: 'House' }, { cs: 'Slunce', en: 'Sun' },
    { cs: 'Červená', en: 'Red' }, { cs: 'Modrá', en: 'Blue' }, { cs: 'Kniha', en: 'Book' },
    { cs: 'Voda', en: 'Water' }
];

const generateEnglishQuestion = (): Question => {
    const word = englishWords[getRandomInt(0, englishWords.length - 1)];
    const correctAnswer = word.en;
    
    const options = new Set<string>();
    options.add(correctAnswer);
    
    while (options.size < 3) {
        const wrong = englishWords[getRandomInt(0, englishWords.length - 1)].en;
        if (wrong !== correctAnswer) options.add(wrong);
    }

    return {
        id: Math.random().toString(),
        text: `Jak se řekne anglicky "${word.cs}"?`,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer,
        type: 'ENGLISH'
    };
};
