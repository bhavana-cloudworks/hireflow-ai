import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import Dashboard from "@/pages/Dashboard";
import Tracker from "@/pages/Tracker";
import Resume from "@/pages/Resume";
import Interview from "@/pages/Interview";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tracker" component={Tracker} />
        <Route path="/resume" component={Resume} />
        <Route path="/interview" component={Interview} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "hsl(222 24% 10%)",
            border: "1px solid hsl(220 18% 20%)",
            color: "hsl(210 20% 92%)",
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
