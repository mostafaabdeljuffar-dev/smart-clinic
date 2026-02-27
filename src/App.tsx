import './mock'
import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import Layout from "./components/layouts/Layout";
import Home from "./pages/Home";
import Login from "./pages/auth/Login/Login";
import { AuthProvider } from "./auth";

const NotFound = lazy(() => import("./pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProvider>
        <Switch>
          <Route path="/">
            <Layout>
              <Home />
            </Layout>
          </Route>

          <Route path="/login" component={Login} />

          <Route component={NotFound} />
        </Switch>
      </AuthProvider>
    </Suspense>
  );
}

export default Router;