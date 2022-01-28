import { Handler } from "@netlify/functions";
import { ApolloServer, gql } from 'apollo-server-lambda'
import fridays from "./fridays.json"
import startend from "./startend.json"
import holidays from "./holidays.json"

interface DayInterface {
    type: string,
    day: number,
    month: number,
    year: number,
    weekday: number
    time: number
}
class Day implements DayInterface {
    type: string
    #date: Date
    constructor(day: number, month: number, year: number, type: string ) {
        this.#date = new Date(`${year}/${month}/${day}`)
        this.type = type;
    }
    get day() {
        return this.#date.getDate()
    }
    get month() {
        return this.#date.getMonth() + 1
    }
    get year() {
        return this.#date.getFullYear()
    }
    get weekday() {
        return this.#date.getDay()
    }
    get time() {
        return this.#date.getTime()
    }
}

const typeDefs = gql`
    type Day {
        day: Int!
        month: Int!
        year: Int!,
        time: Int!
        weekday: Int!
        type: String!
    }

    type Query {
        getDay(day: Int, month: Int, year: Int): Day
        getLastDay: Day
        getFirstDay: Day
    }
`;

let allExceptionDays = new Array()
let startEndDays: {start: Day, end: Day} = {
    start: null,
    end: null
}
holidays.forEach((e) => {
    const date = new Date(e)
    const day = new Day(date.getDate(), date.getMonth() + 1, date.getFullYear(), "H")
    allExceptionDays.splice(day.time, 0, day)
})


Object.keys(startend).forEach((key) => {
    const date = new Date(startend[key])
    const day = new Day(date.getDate(), date.getMonth() + 1, date.getFullYear(), "S")
    switch (key) {
        case ("end"):
            startEndDays.end = day
            break;
        case ("start"):
            startEndDays.start = day;
            break;
        default:
            throw new TypeError()
    } 
    allExceptionDays.splice(day.time, 0, day)
})

Object.keys(fridays).forEach((key) => {
    const date = new Date(key)
    const day = new Day(date.getDate(), date.getMonth() + 1, date.getFullYear(), fridays[key])
    allExceptionDays.splice(day.time, 0, day)
})

const resolvers = {
    Query: {
      getDay: async (source, args: {day: number, month: number, year: number}) => {
            const date = new Day(args.day, args.month, args.year, "tmp")
            if(date.time > startEndDays.end.time || date.time < startEndDays.start.time) {
                date.type = "O"
                return date;
            }
            const dateTimeChecker = (element) => {
                if (element.time == date.time) {
                    return true
                } else {
                    return false
                }
            }
            if(allExceptionDays.findIndex(dateTimeChecker) != -1) {
                return allExceptionDays[allExceptionDays.findIndex(dateTimeChecker)]
            } else {
                switch(date.weekday) {
                    case 0:
                    case 6:
                        date.type = "W"
                        return date
                    case 1:
                    case 3:
                        date.type = "A"
                        return date
                    case 2:
                    case 4:
                        date.type = "B"
                        return date;
                    case 5:
                        return new Error("Friday Missing")
                    default:
                        return new Error("Borked.")
                }
            }

      },
      getLastDay: () => startEndDays.end,
      getFirstDay: () => startEndDays.start
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ event, context, express }) => ({
        headers: event.headers,
        functionName: context.functionName,
        event,
        context,
        expressRequest: express.req,
      }),
  });
  
const handler = server.createHandler({
    expressGetMiddlewareOptions: {
      cors: {
        origin: '*',
        credentials: true,
      }
    },
  });

module.exports.handler = (event, context, callback) => {
    return handler(
      {
        ...event,
        requestContext: event.requestContext || {},
      },
      context,
      callback
    );
  }
  

