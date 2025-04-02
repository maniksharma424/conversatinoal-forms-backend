import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";

import { User } from "../entities/userEntity.js";
import { ENV } from "./env.js";
import { UserRepository } from "../repository/userRepository.js";

const userRepository = new UserRepository();

passport.use(
  new GoogleStrategy(
    {
      clientID: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
      callbackURL: ENV.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: any
    ) => {
      try {
        // Check if user already exists
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Email not provided by Google"), null);
        }

        let user = await userRepository.findByEmail(email);

        if (!user) {
          // Create new user if doesn't exist
          user = await userRepository.create({
            email: email,
            passwordHash: email, // As per requirement, store email as password
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            isVerified: true, // Users authenticated via Google are automatically verified
          } as Partial<User>);
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user into the session
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userRepository.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
