import React from 'react';

const Logo = () => {
  const customFontStyle = {
    fontFamily: 'Blackletter, sans-serif', // Using the Blackletter font
  };

  return (
    <div className="text-center" style={customFontStyle}>
      <h1 className="text-4xl font-extrabold">
        1728 Studios
      </h1>
      <br/>
      <p className="text-2xl relative top-[-1rem]">
        A.I. as easy as 12<sup className="relative top-[-0.5rem] text-red-500 font-bold">3</sup>
      </p>
    </div>
  );
};

export default Logo;
