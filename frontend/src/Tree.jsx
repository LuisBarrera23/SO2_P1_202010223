import React, { useState } from 'react';
import TreeView from 'react-treeview';
import 'react-treeview/react-treeview.css';



  function TreeViewComponent(props) {
    const [expanded, setExpanded] = useState([]);
  
    const toggle = (name) => {
      if (expanded.includes(name)) {
        setExpanded(expanded.filter((n) => n !== name));
      } else {
        setExpanded([...expanded, name]);
      }
    };
  
    const renderTree = (nodes) =>
      nodes.map((node) => (
        <TreeView
          key={node.pid}
          nodeLabel={node.usuario ? 
            `PID: ${node.pid} NOMBRE: ${node.nombre} USUARIO: ${node.usuario} ESTADO: ${node.estado} RAM: ${node.ram}%` :
            `PID: ${node.pid} NOMBRE: ${node.nombre}`}
          onClick={() => toggle(node.pid)}
          collapsed={!expanded.includes(node.pid)}
        >
          {node.hijos && renderTree(node.hijos)}
        </TreeView>
      ));
  
    return <div style={{fontSize:22}}>{renderTree(props.data)}</div>;
  }
  

export default TreeViewComponent;