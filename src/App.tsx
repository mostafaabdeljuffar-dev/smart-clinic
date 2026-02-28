import './mock'
import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import Layout from "./components/layouts/Layout";
import Home from "./pages/Home";
import Login from "./pages/auth/Login/Login";
import { AuthProvider } from "./auth";
import ForgetPassword from './pages/auth/ForgetPassword/ForgetPassword';

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
          <Route path="/forgot-password" component={ForgetPassword} />

          <Route component={NotFound} />
        </Switch>
      </AuthProvider>
    </Suspense>
  );
}

export default Router;