const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../server");
const User = require("../models/User");

jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registers a user", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: "user-id",
      name: "Test User",
      email: "test@example.com"
    });
    bcrypt.hash.mockResolvedValue("hashed");
    jwt.sign.mockReturnValue("token");

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "Test1234!"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBe("token");
    expect(res.body.user.email).toBe("test@example.com");
  });

  test("rejects invalid login", async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nope@example.com", password: "Test1234!" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test("logs in a user", async () => {
    User.findOne.mockResolvedValue({
      _id: "user-id",
      email: "test@example.com",
      name: "Test User",
      password: "hashed"
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("token");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Test1234!" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBe("token");
    expect(res.body.user.email).toBe("test@example.com");
  });
});
