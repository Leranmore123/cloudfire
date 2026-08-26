export declare class PasswordService {
    /**
     * Hashes password using Node.js built-in secure scrypt KDF with random salt
     */
    static hash(password: string): Promise<string>;
    /**
     * Compares password with stored hash
     */
    static compare(password: string, storedHash: string): Promise<boolean>;
}
//# sourceMappingURL=password.d.ts.map