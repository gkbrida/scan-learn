import { FC } from 'react';

interface CarteMemoProps {
  carte: {
    id: string;
    titre: string;
    contenu: string;
  };
}

const CarteMemo: FC<CarteMemoProps> = ({ carte }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2">{carte.titre}</h3>
        <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: carte.contenu }} />
      </div>
    </div>
  );
};

export default CarteMemo; 