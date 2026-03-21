import LoginForm from "@/components/Login/LoginForm";

export default function Page() {
    return (
        <main className="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <section className="w-full max-w-sm">
                <LoginForm />
            </section>
        </main>
    );
}
