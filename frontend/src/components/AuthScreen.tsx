import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, AlertTriangle, ArrowRight, UserPlus, LogIn, Check, Eye, EyeOff } from 'lucide-react';
import { LOCAL_USERS, type LocalUser } from '../data/localUsers';

// ── Usuarios registrados localmente (guardados en localStorage) ───────────────
function getStoredUsers(): LocalUser[] {
  try { return JSON.parse(localStorage.getItem('sous_registered_users') ?? '[]'); }
  catch { return []; }
}

function saveStoredUsers(users: LocalUser[]) {
  localStorage.setItem('sous_registered_users', JSON.stringify(users));
}

function findUser(username: string, password: string): LocalUser | undefined {
  const all = [...LOCAL_USERS, ...getStoredUsers()];
  return all.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase()
      && u.password === password.trim()
  );
}

function usernameExists(username: string): boolean {
  const all = [...LOCAL_USERS, ...getStoredUsers()];
  return all.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
}

export const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1); // 1: Credenciales, 2: Alergias/Disgustos
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        allergies: [] as string[],
        dislikes: [] as string[]
    });

    const [showPassword, setShowPassword] = useState(false);
    const [currentTag, setCurrentTag] = useState('');
    const [tagType, setTagType] = useState<'allergies' | 'dislikes'>('allergies');
    const [error, setError] = useState('');

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentTag.trim() !== '') {
            e.preventDefault();
            setFormData(prev => ({
                ...prev,
                [tagType]: [...prev[tagType], currentTag.trim()]
            }));
            setCurrentTag('');
        }
    };

    const currentList = tagType === 'allergies' ? formData.allergies : formData.dislikes;

    const loginWithData = (data: object) => {
        localStorage.setItem('user', JSON.stringify(data));
        window.dispatchEvent(new Event('userStateChange'));
        navigate('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            // ── Login ──────────────────────────────────────────────────────
            const match = findUser(formData.username, formData.password);
            if (match) {
                loginWithData({ ...match });
            } else {
                setError('Usuario o contraseña incorrectos.');
            }
            return;
        }

        // ── Registro ───────────────────────────────────────────────────────
        if (step === 1) {
            if (formData.username.trim().length < 3) { setError('El usuario debe tener al menos 3 caracteres.'); return; }
            if (formData.password.trim().length < 4)  { setError('La contraseña debe tener al menos 4 caracteres.'); return; }
            if (usernameExists(formData.username))     { setError('Ese nombre de usuario ya está en uso.'); return; }
            setStep(2);
            return;
        }

        // Step 2: guardar nuevo usuario
        const newUser: LocalUser = {
            username: formData.username.trim(),
            password: formData.password.trim(),
            xp: 0,
            rank: 'Iniciado',
            is_admin: false,
        };
        const stored = getStoredUsers();
        saveStoredUsers([...stored, newUser]);
        loginWithData({ ...newUser });
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center">
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="bg-white p-3 rounded-2xl shadow-xl">
                        <ChefHat className="text-orange-500 w-12 h-12" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-black text-white drop-shadow-md">
                    {isLogin ? 'Bienvenido a Sous' : 'Únete a la Brigada'}
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-neutral-100">

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}
                        {step === 1 && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700">Usuario</label>
                                    <div className="mt-1">
                                        <input
                                            required
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            autoComplete="off"
                                            spellCheck={false}
                                            className="appearance-none block w-full px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                            placeholder="Ej. ChefGus"
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-bold text-neutral-700">Correo Electrónico</label>
                                        <div className="mt-1">
                                            <input
                                                type="email"
                                                required
                                                className="appearance-none block w-full px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                                placeholder="tu@correo.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-neutral-700">Contraseña</label>
                                    <div className="mt-1 relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            autoComplete="off"
                                            className="appearance-none block w-full px-3 py-3 pr-11 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <button
                                        type="submit"
                                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                                    >
                                        {isLogin ? <><LogIn size={18} /> Entrar</> : <><ArrowRight size={18} /> Continuar</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && !isLogin && (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                                <div className="text-center mb-6">
                                    <AlertTriangle className="mx-auto h-12 w-12 text-orange-500 mb-2" />
                                    <h3 className="text-lg font-black text-neutral-900">¿Hay algo que debamos evitar?</h3>
                                    <p className="text-sm text-neutral-500 mt-1">Sous diseñará y bloqueará recomendaciones basado en esto de forma estricta.</p>
                                </div>

                                <div className="flex gap-2 mb-4 p-1 bg-neutral-100 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setTagType('allergies')}
                                        className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${tagType === 'allergies' ? 'bg-white shadow-sm text-red-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        Alergias (Peligro)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTagType('dislikes')}
                                        className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${tagType === 'dislikes' ? 'bg-white shadow-sm text-orange-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        No me gusta
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    className="appearance-none block w-full px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm mb-4"
                                    placeholder={`Escribe un ingrediente y presiona ENTER`}
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />

                                <div className="flex flex-wrap gap-2 min-h-[80px] p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                    {currentList.length === 0 ? (
                                        <span className="text-neutral-400 text-sm italic w-full text-center mt-2">No hay {tagType === 'allergies' ? 'alergias' : 'ingredientes no deseados'} agregados.</span>
                                    ) : (
                                        currentList.map((tag, idx) => (
                                            <div key={idx} className={`px-3 py-1 text-sm font-bold rounded-full flex items-center gap-1 ${tagType === 'allergies' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {tag}
                                                <button type="button" onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        [tagType]: prev[tagType].filter(t => t !== tag)
                                                    }))
                                                }} className="ml-1 hover:text-neutral-900">&times;</button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 px-4 border border-neutral-200 rounded-xl shadow-sm text-sm font-bold text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-neutral-900 hover:bg-black transition-colors"
                                    >
                                        <Check size={18} /> Crear Cuenta
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    {step === 1 && (
                        <div className="mt-6 space-y-3">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-neutral-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-neutral-500">
                                        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(''); setStep(1); }}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 border shadow-sm rounded-xl text-sm font-bold text-neutral-700 bg-white hover:bg-neutral-50 transition-colors border-neutral-200"
                            >
                                {isLogin ? <><UserPlus size={18} /> Registrarse</> : <><LogIn size={18} /> Iniciar Sesión</>}
                            </button>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
