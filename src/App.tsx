import AppProviders from "@/app/providers";
import AppRouter from "@/app/router/AppRouter";

export default function App() {
  return (
    <AppProviders>
      <div className="flex min-h-0 flex-1 flex-col">
        <AppRouter />
      </div>
    </AppProviders>
  );
}
