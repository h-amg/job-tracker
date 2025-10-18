import { prisma } from "@/lib/prisma";

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
}

export class UserService {
  /**
   * Get the first user or create a default one if none exists
   */
  static async getOrCreateUser(): Promise<UserProfile> {
    try {
      // Try to get the first user
      let user = await prisma.user.findFirst();
      
      // If no user exists, create a default one
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: "User",
            email: "",
            phone: "",
          },
        });
      }
      
      return user;
    } catch (error) {
      console.error("Error getting or creating user:", error);
      throw new Error("Failed to get or create user");
    }
  }

  /**
   * Update user profile information
   */
  static async updateUser(data: UpdateUserData): Promise<UserProfile> {
    try {
      // Get the first user (for now, we assume single user)
      const existingUser = await prisma.user.findFirst();
      
      if (!existingUser) {
        throw new Error("No user found to update");
      }

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user profile");
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserById(id: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      
      return user;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw new Error("Failed to get user");
    }
  }
}
