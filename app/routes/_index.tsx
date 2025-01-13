import { Login, meta, loader } from './auth/login'

export { meta, loader }

export default function App() {
    return (
        <Login />
    );
}