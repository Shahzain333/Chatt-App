import React from 'react';
import Logo from '../../assets/logo.png';

const EmptyChatState = () => {
    return (
        <section className="h-screen w-full bg-[#e5f6f3]">
            <div className="flex flex-col justify-center items-center h-full">
                <img src={Logo} alt="Chatfrik Logo" width={100} />
                <h1 className="text-3xl font-bold text-teal-700 mt-5">Welcome to Chatfrik</h1>
                <p className="text-gray-500">Connect and chat with friends easily, securely, fast and free</p>
            </div>
        </section>
    );
};

export default EmptyChatState;