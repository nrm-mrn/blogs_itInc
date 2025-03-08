import { agent } from "supertest";
import { app } from "../src";

export const req = agent(app)
