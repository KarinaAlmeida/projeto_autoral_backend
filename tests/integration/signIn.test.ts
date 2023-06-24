import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';
import supertest from 'supertest';
import { cleanDb } from '../helpers';
import app, { init } from '@/app';
import { createUser } from '../factories/users.factory';


beforeAll(async () => {
    await init();
    await cleanDb();
  });

  const server = supertest(app);

  describe("POST /", () => {
    it("should respond with status 400 when body is not given", async () => {
      const response = await server.post("/");
  
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });
  
    it("should respond with status 400 when body is not valid", async () => {
      const invalidBody = { [faker.lorem.word()]: faker.lorem.word() };
  
      const response = await server.post("/").send(invalidBody);
  
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });
  
    describe("when body is valid", () => {
      const generateValidBody = () => ({
        email: faker.internet.email(),
        password: faker.internet.password({ length: 6 }),
      });
  
      it("should respond with status 401 if there is no user for given email", async () => {
        const body = generateValidBody();
  
        const response = await server.post("/").send(body);
  
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
  
      it("should respond with status 401 if there is a user for given email but password is incorrect", async () => {
        await createUser();
        const body = generateValidBody();
  
        const response = await server.post("/").send({
          ...body,
          password: faker.lorem.word(),
        });
  
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
  
      describe("when credentials are valid", () => {
        it("should respond with status 200", async () => {
          const body = generateValidBody();
          await createUser(body.email, body.password);
  
          const response = await server.post("/").send(body);
  
          expect(response.status).toBe(httpStatus.OK);
        });
  
        it("should respond with token and pic", async () => {
          const body = generateValidBody();
          const user =await createUser(body.email, body.password);
  
          const response = await server.post("/").send(body);
          
          expect(response.body).toEqual({
            user: {
            pic: user.picture,
            token: response.body.user.token,
            }
          });
        });
      });
    });
  });