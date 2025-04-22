import { useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useResizeDetector } from 'react-resize-detector';
import '../styles/main.css'
import * as d3 from 'd3';

// 哈希颜色生成函数
const hashCode = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

const getHslColor = (str, saturation = 70, lightness = 50) => {
  const hash = hashCode(str);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const KnowledgeGraph = ({ data = { nodes: [], links: [] } }) => {
  const { width, height, ref } = useResizeDetector();
  const fgRef = useRef();

  // 处理图形数据（包含初始位置）
  const graphData = useMemo(() => {
    const colorCache = new Map();
    
    const nodes = data.nodes.map(node => {
      // 生成唯一颜色
      let color = '#999999';
      if (node.group) {
        if (!colorCache.has(node.group)) {
          colorCache.set(node.group, getHslColor(node.group));
        }
        color = colorCache.get(node.group);
      }

      return {
        ...node,
        x: Math.random() * 100,  // 初始随机位置
        y: Math.random() * 100,
        color: color,
      };
    });

    return {
      nodes,
      links: data.links.map(link => ({
        ...link,
        color: '#cccccc',
      }))
    };
  }, [data]);

  // 物理引擎配置
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge', d3.forceManyBody().strength(-120));
      fgRef.current.d3Force('link', d3.forceLink().distance(150));
    }
  }, []);

  return (
    <div ref={ref} className="knowledge-graph-container" style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height || 500}
        graphData={graphData}
        nodeRelSize={8}
        linkWidth={1}
        
        linkCurvature={0.2}
        d3VelocityDecay={0.2}
        warmupTicks={200}
        cooldownTicks={Infinity}
        onEngineStop={() => {
          fgRef.current?.zoomToFit(800);
        }}
        
        // 完整节点绘制逻辑
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          const padding = 2;
          
          // 绘制圆形节点
          ctx.beginPath();
          ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();

          // 计算文本尺寸
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const textHeight = parseInt(ctx.font, 10);

          // 绘制文本背景
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.roundRect(
            node.x - textWidth/2 - padding,
            node.y + 8 - padding,
            textWidth + padding*2,
            textHeight + padding*2,
            4
          );
          ctx.fill();

          // 绘制节点文本
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = '#333333';
          ctx.fillText(label, node.x, node.y + 8);
        }}

        // 完整边绘制逻辑
        linkCanvasObject={(link, ctx) => {
          const { source, target, type } = link;
          const [sx, sy] = [source.x, source.y];
          const [tx, ty] = [target.x, target.y];
          const midPoint = [(sx + tx)/2, (sy + ty)/2];
          
          // 绘制连接线
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = link.color;
          ctx.lineWidth = 1;
          ctx.stroke();

          // 箭头绘制逻辑
          const arrowSize = 5;
          const arrowDirection = Math.atan2(ty - sy, tx - sx);
          const arrowHeadPos = 0.9;
          
          // 计算箭头位置
          const arrowX = sx + (tx - sx) * arrowHeadPos;
          const arrowY = sy + (ty - sy) * arrowHeadPos;
          
          // 绘制箭头三角形
          ctx.beginPath();
          ctx.moveTo(
            arrowX - arrowSize * Math.cos(arrowDirection - Math.PI / 6),
            arrowY - arrowSize * Math.sin(arrowDirection - Math.PI / 6)
          );
          ctx.lineTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - arrowSize * Math.cos(arrowDirection + Math.PI / 6),
            arrowY - arrowSize * Math.sin(arrowDirection + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = link.color;
          ctx.fill();

          // 绘制边类型文本
          if (type) {
            ctx.save();
            ctx.translate(midPoint[0], midPoint[1]);
            ctx.rotate(Math.atan2(ty - sy, tx - sx));
            
            ctx.font = '10px Sans-Serif';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText(type, 0, -5);
            
            ctx.restore();
          }
        }}
      />
    </div>
  );
};

export default KnowledgeGraph;