import React, { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';



const MindmapMode = ({ 
  data, 
}) => {
  const [value, setValue] = useState("");
  const refSvg = useRef(null);
  const transformer = new Transformer();

  useEffect(() => {
    if (refSvg.current && value) {
      const mm = Markmap.create(refSvg.current);
      if (!mm) return;

      const transformData = transformer.transform(value);
      console.log("root", transformData);
      const { root } = transformData;
      mm.setData(root);
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setValue(data);
      clearTimeout(timer);
    }, 1000);
  }, []);

  return (
    <div className="mindmap-page" style={{ 
      width: '100%', 
      height: '100%',
      position: 'relative',  
      overflow: 'hidden'     
    }}>
      <svg 
        ref={refSvg} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '100vh'  // 确保最小高度可视区域
        }}
      />
    </div>
  );
};


export default MindmapMode;