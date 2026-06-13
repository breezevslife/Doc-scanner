import React, { useState, useEffect, useRef } from 'react';
import { 
  DocumentType, 
  OcrDocument, 
  AuditLog, 
  ChatMessage, 
  DashboardStats,
  Table as DocTable,
  DocumentVersion,
  DocumentComment
} from './types';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Upload, 
  Layers, 
  Download, 
  Languages, 
  RefreshCw, 
  FileSignature, 
  MessageSquare, 
  Send, 
  FileUp, 
  Users, 
  Percent, 
  Database, 
  Activity, 
  ChevronRight, 
  ShieldAlert, 
  Trash2, 
  User, 
  Plus, 
  Edit3, 
  FileSpreadsheet, 
  ExternalLink,
  ChevronDown,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // System states
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('endbrij@gmail.com');
  const [userRole, setUserRole] = useState<'Analyst' | 'Admin'>('Analyst');
  const [documents, setDocuments] = useState<OcrDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  
  // Custom workspace views
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'layout' | 'translate' | 'rewrite' | 'compliance' | 'esign' | 'version'>('layout');
  
  // Interactive processing forms
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadName, setUploadName] = useState<string>('');
  const [uploadType, setUploadType] = useState<DocumentType>(DocumentType.INVOICE);
  const [uploadText, setUploadText] = useState<string>('');
  const [uploadMime, setUploadMime] = useState<string>('image/png');
  const [uploadFileSelected, setUploadFileSelected] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Gemini & Text utilities
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  
  const [transLanguage, setTransLanguage] = useState<string>('Spanish');
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [transLoading, setTransLoading] = useState<boolean>(false);

  const [rewriteTone, setRewriteTone] = useState<string>('Formal');
  const [rewrittenContent, setRewrittenContent] = useState<string>('');
  const [rewriteLoading, setRewriteLoading] = useState<boolean>(false);

  // Version editing
  const [editingContent, setEditingContent] = useState<string>('');
  const [versionChangeNote, setVersionChangeNote] = useState<string>('');
  const [versionAuthor, setVersionAuthor] = useState<string>('Joe Corporate');
  const [versionLoading, setVersionLoading] = useState<boolean>(false);

  // Team comments
  const [commentInput, setCommentInput] = useState<string>('');

  // E-Signature
  const [esignName, setEsignName] = useState<string>('');
  const [esignEmail, setEsignEmail] = useState<string>('');
  const [esignDraw, setEsignDraw] = useState<string>('');

  // System alerts
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Dropdown states
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  // Ref for chat auto-scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial dataset
  useEffect(() => {
    fetchDocuments();
    fetchStats();
    fetchAuditLogs();
    fetchAdminUsers();
  }, []);

  // Sync selected text when doc changes
  const activeDoc = documents.find(d => d.id === selectedDocId) || null;
  useEffect(() => {
    if (activeDoc) {
      setEditingContent(activeDoc.extractedText);
      setVersionChangeNote('');
      setTranslatedContent('');
      setRewrittenContent('');
      // Load initial chat messages from file or default greeting
      setChatMessages([
        {
          id: 'chat-init',
          sender: 'assistant',
          text: `Hello! I have loaded "${activeDoc.name}" (${activeDoc.confidence}% confidence OCR). You can ask me to summarize components, parse numeric values, search compliance violations, or extract specific lines. What can I assist you with?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [selectedDocId]);

  // Keep chat scrolled
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const triggerToast = (msg: string, isError: boolean = false) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0 && !selectedDocId) {
          setSelectedDocId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching documents', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching statistics', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error fetching auditing indicators', err);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.users || []);
        setAdminStats(data.statistics || null);
      }
    } catch (err) {
      console.error('Error loading administrative user directory', err);
    }
  };

  // Pre-seed sample simulation files
  const loadSimulatorTemplate = (templateType: 'invoice' | 'resume' | 'contract') => {
    if (templateType === 'invoice') {
      setUploadName('Epsilon_Broadband_Invoice_492.jpg');
      setUploadType(DocumentType.INVOICE);
      setUploadMime('image/jpeg');
      setUploadText(
        `EPSILON BROADBAND NETWORKS INC
1900 Silicon Parkway, Suite 120
San Jose, CA 95112

INVOICE #INV-2026-4928
DATE: June 12, 2026
DUE DATE: July 12, 2026
ACCOUNT NO: ACC-81729
BILL TO:
Global Tech Innovations
Attn: Accounts Payable
800 Enterprise Drive
Austin, TX 78701

Itemized Operations Details:
-----------------------------------------------------------
1. High-Speed Dedicated Fiber 10Gbps (June 2026 Cycle) 
   Qty: 1   | Unit Price: $3,200.00 | Total: $3,200.00
2. Static Cloud IP Multiplexing block (v4 & v6 addresses)
   Qty: 12  | Unit Price: $15.00   | Total: $180.00
3. Distributed DDoS Mitigation Firewall Core Protection
   Qty: 1   | Unit Price: $1,250.00 | Total: $1,250.00
-----------------------------------------------------------
Subtotal: $4,630.00
State Sales Tax (8.25%): $382.00
TOTAL DUE FEE: $5,012.00

Payment Mode Required: ACH/Electronic Wire Transfer code
Routing Transit No: 121000248
Federal Tax ID EIN: 12-9481726a
Security Checklist Verified Status: AAA Passed.`
      );
      setUploadFileSelected('Epsilon_Broadband_Invoice_492.jpg (382 KB - Simulated Scan)');
    } else if (templateType === 'resume') {
      setUploadName('Dev_Candidate_Evelyn_Martinez_CV.png');
      setUploadType(DocumentType.RESUME);
      setUploadMime('image/png');
      setUploadText(
        `EVELYN MARTINEZ - PRINCIPAL CLOUD ARCHITECT
Email: evelyn.martinez@cloudnet.io | Phone: (512) 555-0192 | Austin, TX
GitHub: github.com/evelyn-martinez | LinkedIn: linkedin.com/in/evelyn-martinez-lead

PROFESSIONAL SUMMARY:
Over 11 years of robust technical architecture experience deploying mission-critical systems. Pioneer of modern Golang container services, Kubernetes orchestrations, and secure cloud API designs. Documented track record saving up to 40% cloud billing architectures via optimized container instances and stateless load balancing.

PROFESSIONAL EXPERIENCE:
1. Lead Systems Engineer | Vanguard Cloud Metrics | 2022 - Present
   - Maintained AWS and GCP multi-region state engines deploying Kubernetes clusters serving 18M daily users.
   - Migrated legacy Java services into native Rust/Go endpoints resulting in 4.2x faster response metrics.
2. Senior Infrastructure Developer | Apex Telecom Group | 2018 - 2022
   - Structured Terraform infrastructure-as-code deployments for over 45 tenant business databases.
   - Directed security vulnerability patches reducing open network breach exploits by 99.4%.

RELEVANT SKILLS:
- Technical Architectures: Golang, Rust, Python, TypeScript, Bash Shell shell.
- Platforms & Frameworks: Kubernetes, Amazon AWS, Google Cloud Engine, Docker, Drizzle ORM, NestJS.
- Certifications: Certified Kubernetes Administrator (CKA), Google Professional Cloud Architect.`
      );
      setUploadFileSelected('Dev_Candidate_Evelyn_Martinez_CV.png (1.2 MB - Simulated High Fidelity Scan)');
    } else if (templateType === 'contract') {
      setUploadName('Silicon_SaaS_Service_Agreement.pdf');
      setUploadType(DocumentType.CONTRACT);
      setUploadMime('application/pdf');
      setUploadText(
        `SOFTWARE-AS-A-SERVICE (SaaS) SERVICES MASTER AGREEMENT
This agreement is executed and entered into effective as of May 14, 2026, by and between Silicon Mindsystems Inc ("Provider") and Apex Corporate Solutions Ltd ("Customer").

1. SCOPE OF UTILITY
Provider shall make available its high-efficiency AI document processing pipeline to Customer's designated organizational seats. Service level uptime commitment is guaranteed at 99.9%.

2. FINANCIAL AND SUBSCRIPTION STRUCTURE
Customer agrees to pay a recurring corporate fee of $14,000.00 USD each month billed on the 1st of each calendar term. Overdue invoices left unsettled beyond 15 business days (Net 15 Terms) shall incur an automatic penalty rate of 1.5% per week on all unpaid balance pools.

3. DATA RETENTION, ANONYMIZATION, AND COMPLIANCE RULES
Provider shall retain scanned raw image binaries for up to 30 calendar days to verify OCR accuracy metrics, after which they are vaporized. Under no circumstances will Apex proprietary document metadata be transferred to external training models.

4. INDEMNIFICATION LIMITS & LIABILITY CAP
MAXIMUM ACCUMLATIVE LIABILITY OF PROVIDER FOR ALL ACTUAL CLAIMS AND FAULTS SHALL UNDER NO CIRCUMSTANCE EXCEED RECURRING SUMS PAID IN THE PREVIOUS THREE (3) MONTH TERMS. Provider shall not hold responsibility for indirect or consequential damages.

5. TERMINATION OR DISCHARGE
Either corporate entity may discharge this agreement by providing formal written notification at least 90 calendar days prior (90 Days Termination Clause) to the active renewal period.`
      );
      setUploadFileSelected('Silicon_SaaS_Service_Agreement.pdf (2.4 MB - Simulated Contract PDF)');
    }
  };

  // Send search request
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchDocuments();
      return;
    }
    try {
      const res = await fetch(`/api/documents/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0) {
          setSelectedDocId(data[0].id);
        } else {
          triggerToast('No document matched your smart query parameter.', true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run Document Submission
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadText) {
      triggerToast('Please provide a document title and drag content or load a simulation template.', true);
      return;
    }

    // Check for duplicate names
    const duplicate = documents.find(d => d.name.toLowerCase() === uploadName.toLowerCase());
    if (duplicate && !duplicateWarning) {
      setDuplicateWarning(`A document named "${uploadName}" already exists. Submitting will register it as a conflict/version. Do you want to proceed?`);
      return;
    }

    setIsUploading(true);
    setDuplicateWarning(null);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadName,
          type: uploadType,
          size: uploadFileSelected ? '1.8 MB' : '450 KB',
          mimeType: uploadMime,
          customText: uploadText,
          folderName: uploadType === DocumentType.INVOICE ? 'Invoices' : uploadType === DocumentType.CONTRACT ? 'Contracts' : 'Archived'
        })
      });

      if (response.ok) {
        const newDoc: OcrDocument = await response.json();
        triggerToast(`Successfully processed "${newDoc.name}" with Gemini IDP! Folder set to ${newDoc.folderName}.`);
        
        // Refresh docs
        await fetchDocuments();
        await fetchStats();
        await fetchAuditLogs();
        
        setSelectedDocId(newDoc.id);
        setActiveWorkspaceTab('layout'); // jump to layout workspace
        
        // Clear forms
        setUploadName('');
        setUploadText('');
        setUploadFileSelected('');
      } else {
        triggerToast('Failed to convert document through the server OCR module.', true);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error during AI extraction.', true);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you authorized to delete this document from the secure vault?')) return;
    
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('Document successfully purged from compliance vaults.');
        const updatedDocs = documents.filter(d => d.id !== id);
        setDocuments(updatedDocs);
        if (selectedDocId === id && updatedDocs.length > 0) {
          setSelectedDocId(updatedDocs[0].id);
        }
        fetchStats();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Purge request failed.', true);
    }
  };

  // Run AI Chat Companion
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeDoc) return;

    const userMsg: ChatMessage = {
      id: 'chat-' + Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch(`/api/documents/${activeDoc.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.text, history: chatMessages })
      });

      if (res.ok) {
        const data = await res.json();
        const serverMsg: ChatMessage = {
          id: 'chat-' + Math.random().toString(36).substr(2, 9),
          sender: 'assistant',
          text: data.answer,
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, serverMsg]);
      } else {
        triggerToast('AI Intelligence offline or unavailable.', true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Ask AI translation helper
  const handleTranslateRun = async () => {
    if (!activeDoc) return;
    setTransLoading(true);
    setTranslatedContent('');
    try {
      const res = await fetch(`/api/documents/${activeDoc.id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: transLanguage })
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedContent(data.translatedText);
        triggerToast(`Translated text to ${transLanguage} successfully.`);
      } else {
        triggerToast('Could not complete document translation layout.', true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransLoading(false);
    }
  };

  // Ask AI custom tone re-writer
  const handleRewriteRun = async () => {
    if (!activeDoc) return;
    setRewriteLoading(true);
    setRewrittenContent('');
    try {
      const res = await fetch(`/api/documents/${activeDoc.id}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone: rewriteTone })
      });
      if (res.ok) {
        const data = await res.json();
        setRewrittenContent(data.rewrittenText);
        triggerToast(`Re-drafted in a pristine "${rewriteTone}" voice.`);
      } else {
        triggerToast('Failed to rewrite source format.', true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRewriteLoading(false);
    }
  };

  // Version Control Save Draft 
  const handleVersionSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc) return;
    if (!editingContent.trim()) {
      triggerToast('Extracted content draft body cannot be empty.', true);
      return;
    }
    setVersionLoading(true);
    try {
      const res = await fetch(`/api/documents/${activeDoc.id}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeSummary: versionChangeNote || 'Manual modification using text dashboard editor.',
          content: editingContent,
          author: currentUserEmail
        })
      });

      if (res.ok) {
        const data = await res.json();
        triggerToast(`Committed Version ${data.versionNo} of ${activeDoc.name} successfully!`);
        setVersionChangeNote('');
        
        // Refresh local memory representation
        await fetchDocuments();
        await fetchAuditLogs();
      } else {
        triggerToast('Could not commit newer document version.', true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVersionLoading(false);
    }
  };

  // Interactive Team Comments
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeDoc) return;

    try {
      const res = await fetch(`/api/documents/${activeDoc.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: commentInput,
          author: currentUserEmail
        })
      });

      if (res.ok) {
        const newComm = await res.json();
        // Insert physically into local document comments list
        activeDoc.comments.push(newComm);
        setCommentInput('');
        triggerToast('Collaborative team note saved.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sign Document Off
  const handleSignDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esignName || !esignEmail || !activeDoc) {
      triggerToast('Please complete signer full corporate name and verification email address.', true);
      return;
    }

    try {
      const res = await fetch(`/api/documents/${activeDoc.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: esignName,
          email: esignEmail,
          signatureDraw: esignDraw || "DIGITAL_VERIFICATION_CERT_MD5_CRYPT_SUCCESS"
        })
      });

      if (res.ok) {
        const data = await res.json();
        activeDoc.eSignatures.push(data);
        triggerToast(`Digital Sign-off successfully registered for ${esignName}!`);
        setEsignName('');
        setEsignEmail('');
        setEsignDraw('');
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper folders list
  const foldersList = ['All', 'Invoices', 'Contracts', 'Resumes', 'Archived'];

  // Match folder selections
  const filteredDocuments = documents.filter(doc => {
    if (selectedFolder === 'All') return true;
    if (selectedFolder === 'Invoices') return doc.type === DocumentType.INVOICE;
    if (selectedFolder === 'Contracts') return doc.type === DocumentType.CONTRACT;
    if (selectedFolder === 'Resumes') return doc.type === DocumentType.RESUME;
    if (selectedFolder === 'Archived') return doc.type !== DocumentType.INVOICE && doc.type !== DocumentType.CONTRACT && doc.type !== DocumentType.RESUME;
    return true;
  });

  // Calculate stats display numbers (fallback standard defaults)
  const statsTotal = stats?.totalProcessed || 49;
  const statsAccuracy = stats?.ocrAccuracy || 98.6;
  const statsStorage = stats?.storageUsageGb || 1.45;
  const statsLimit = stats?.storageLimitGb || 10.0;
  const statsPercent = (statsStorage / statsLimit) * 100;

  // Render trigger downloads format exports
  const triggerSimulationDownload = (format: string) => {
    if (!activeDoc) return;
    
    let simulatedText = '';
    const divider = '='.repeat(60);
    
    switch(format.toLowerCase()) {
      case 'pdf':
        simulatedText = `[SECURE PDF RENDER ARCHIVE]\nDocID: ${activeDoc.id}\nDocument Title: ${activeDoc.name}\nConfidence Score: ${activeDoc.confidence}%\n\n${divider}\nEXTRACTED OCR WORKSPACE:\n\n${activeDoc.extractedText}\n\n${divider}\nDocuMind AI Hash: md5_${activeDoc.id.substring(0,6)}_sha256`;
        break;
      case 'word':
        simulatedText = `[MICROSOFT WORD .DOCX FORMAT ENCODING]\nTitle: ${activeDoc.name}\nVersion No: LATEST\n\n${activeDoc.extractedText}`;
        break;
      case 'excel':
        if (activeDoc.tables && activeDoc.tables.length > 0) {
          const table = activeDoc.tables[0];
          simulatedText = `[EXCEL FORMAT EXPORT]\nSheet: ${table.name || 'Table 1'}\n\n` + 
            table.headers.join('\t') + '\n' + 
            table.rows.map(row => row.join('\t')).join('\n');
        } else {
          simulatedText = `[EXCEL LAYOUT ANALYSIS]\nAttribute\tParsedValue\nName\t${activeDoc.name}\nConfidence\t${activeDoc.confidence}\nCategory\t${activeDoc.category}`;
        }
        break;
      case 'csv':
        if (activeDoc.tables && activeDoc.tables.length > 0) {
          const table = activeDoc.tables[0];
          simulatedText = table.headers.map(h => `"${h}"`).join(',') + '\n' + 
            table.rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        } else {
          simulatedText = `"Attribute","ParsedValue"\n"Name","${activeDoc.name}"\n"Confidence","${activeDoc.confidence}"\n"Category","${activeDoc.category}"`;
        }
        break;
      case 'json':
        simulatedText = JSON.stringify(activeDoc, null, 2);
        break;
      case 'markdown':
        simulatedText = `# ${activeDoc.name}\n**Confidence Score**: \`${activeDoc.confidence}%\`\n**Document Type**: *${activeDoc.type}*\n\n## Summary\n${activeDoc.summary.executive}\n\n## Extracted Text\n\`\`\`\n${activeDoc.extractedText}\n\`\`\`\n`;
        break;
      case 'text':
      default:
        simulatedText = activeDoc.extractedText;
    }

    // Dynamic browser physical download file creation
    const blob = new Blob([simulatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDoc.name.replace(/\.[^/.]+$/, "")}_converted.${format === 'word' ? 'docx' : format === 'excel' ? 'xlsx' : format.toLowerCase()}`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
    
    // Log Download action in Audit Log
    const dlAudit: AuditLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      userEmail: currentUserEmail,
      action: `File Export (${format.toUpperCase()})`,
      timestamp: new Date().toISOString(),
      details: `User converted & downloaded local copy of ${activeDoc.name} as specialized ${format.toUpperCase()} format.`,
      ipAddress: '127.0.0.1'
    };
    
    // Unshift client side
    setAuditLogs(prev => [dlAudit, ...prev]);
    triggerToast(`Created ready-to-use .${format.toLowerCase()} file for download.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Dynamic Toast Notifications */}
      {successToast && (
        <div id="toast-success" className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500 text-emerald-300 py-3 px-5 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div id="toast-error" className="fixed top-5 right-5 z-50 bg-rose-950 border border-rose-500 text-rose-300 py-3 px-5 rounded-lg shadow-2xl flex items-center gap-3 animate-pulse">
          <AlertTriangle size={20} className="text-rose-400 shrink-0" />
          <span className="text-sm font-medium">{errorToast}</span>
        </div>
      )}

      {/* Main Enterprise Header */}
      <header id="app-header" className="border-b border-slate-900 bg-slate-950 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl text-slate-950 shadow-inner">
            <Layers className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              DocuMind AI
              <span className="text-[10px] bg-slate-800 text-cyan-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                Enterprise IDP v3.2
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-normal">Intelligent Document Processing & Structure Extraction Platform</p>
          </div>
        </div>

        {/* Stats Strip */}
        <div id="header-stats" className="hidden lg:flex items-center gap-8 bg-slate-900/60 border border-slate-900 px-6 py-2.5 rounded-2xl">
          <div className="text-center">
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Documents Processed</span>
            <span className="text-sm font-mono font-bold text-slate-200">{statsTotal}</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="text-center">
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">OCR Classification Accuracy</span>
            <span className="text-sm font-mono font-bold text-emerald-400 flex items-center justify-center gap-1">
              <Percent size={13} /> {statsAccuracy}%
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="text-center">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Active Secure Storage</span>
              <span className="text-[10px] font-mono text-cyan-400">({statsPercent.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${statsPercent}%` }}></div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">{statsStorage} / {statsLimit} GB</span>
            </div>
          </div>
        </div>

        {/* User Identity Controller */}
        <div id="user-identity" className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              {currentUserEmail}
            </div>
            <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 mt-1 font-mono">
              Role: <strong className="text-cyan-400">{userRole}</strong>
            </span>
          </div>
          
          <button 
            id="role-switch-btn"
            onClick={() => setUserRole(userRole === 'Analyst' ? 'Admin' : 'Analyst')}
            className="p-1 px-2.5 text-[11px] font-mono border border-slate-800 rounded-lg hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Switch User Role Mockup"
          >
            Switch to {userRole === 'Analyst' ? 'Admin Mode' : 'Analyst Mode'}
          </button>
        </div>
      </header>

      {/* Main Complex Grid */}
      <div id="main-grid" className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden">
        
        {/* COL 1: Document Upload & List Explorer (xl:col-span-3) */}
        <aside id="sidebar-panel" className="xl:col-span-3 border-r border-slate-900 bg-slate-950/80 p-4 flex flex-col gap-4 overflow-y-auto">
          
          {/* Section: Upload Document Form */}
          <div id="card-upload" className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              Upload / Generate Document
              <span className="text-[10px] font-mono text-cyan-400">Gemini OCR</span>
            </h3>

            {/* Simulators */}
            <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/40 flex flex-col gap-2">
              <span className="font-semibold text-[11px] text-slate-300">Fast Interactive Simulator:</span>
              <div className="grid grid-cols-3 gap-1">
                <button 
                  id="btn-seed-invoice"
                  onClick={() => loadSimulatorTemplate('invoice')}
                  type="button"
                  className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 py-1 px-1.5 rounded-md border border-slate-800 text-center uppercase tracking-tighter hover:text-cyan-400 transition"
                >
                  Invoice
                </button>
                <button 
                  id="btn-seed-resume"
                  onClick={() => loadSimulatorTemplate('resume')}
                  type="button"
                  className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 py-1 px-1.5 rounded-md border border-slate-800 text-center uppercase tracking-tighter hover:text-cyan-400 transition"
                >
                  Resume
                </button>
                <button 
                  id="btn-seed-contract"
                  onClick={() => loadSimulatorTemplate('contract')}
                  type="button"
                  className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 py-1 px-1.5 rounded-md border border-slate-800 text-center uppercase tracking-tighter hover:text-cyan-400 transition"
                >
                  Agreement
                </button>
              </div>
            </div>

            <form onSubmit={handleUploadDocument} className="flex flex-col gap-3 mt-1">
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-slate-400 mb-1">Document Title</label>
                <input 
                  type="text" 
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. invoice_6103.png" 
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-slate-400 mb-1">Document Type</label>
                  <select 
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as DocumentType)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-all font-mono"
                  >
                    <option value={DocumentType.INVOICE}>Invoice</option>
                    <option value={DocumentType.CONTRACT}>Contract</option>
                    <option value={DocumentType.RESUME}>Resume/CV</option>
                    <option value={DocumentType.MEDICAL_REPORT}>Medical Brief</option>
                    <option value={DocumentType.TAX_DOCUMENT}>Tax/Financial</option>
                    <option value={DocumentType.OTHER}>Other / Raw</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-slate-400 mb-1">Content Mime</label>
                  <select
                    value={uploadMime}
                    onChange={(e) => setUploadMime(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-all font-mono text-[11px]"
                  >
                    <option value="image/png">image/png</option>
                    <option value="image/jpeg">image/jpeg</option>
                    <option value="application/pdf">application/pdf</option>
                    <option value="text/plain">text/plain</option>
                  </select>
                </div>
              </div>

              {/* Text Area simulating scanner output upload */}
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-slate-400 mb-1">
                  Scanned Document Copy / OCR Source
                </label>
                <textarea 
                  rows={4}
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  placeholder="Paste scanned raw document text representation here..." 
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500 transition-all font-mono leading-relaxed"
                />
              </div>

              {uploadFileSelected && (
                <div className="bg-cyan-950/20 border border-cyan-900/60 p-2 rounded text-[11px] text-cyan-300 font-mono">
                  {uploadFileSelected}
                </div>
              )}

              {duplicateWarning && (
                <div className="bg-amber-950/40 border border-amber-600/50 p-2.5 rounded-lg text-xs text-amber-300">
                  <p className="mb-2 font-medium">{duplicateWarning}</p>
                  <button 
                    type="button"
                    onClick={() => {
                      setDuplicateWarning(null);
                      // Force submission appending suffix or trigger anyways
                      setUploadName(n => `${n.replace(/\.[^/.]+$/, "")}_new_version`);
                    }}
                    className="bg-amber-700 hover:bg-amber-600 font-semibold px-2 py-1 text-[10px] rounded text-slate-950 uppercase cursor-pointer"
                  >
                    Rename and submit
                  </button>
                </div>
              )}

              <button 
                id="btn-upload-submit"
                disabled={isUploading}
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-cyan-500/20 active:scale-[98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Extracting via Gemini IDP...
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Process Document Scan
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section: Documents Folder Categories */}
          <div id="folder-filters" className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">Storage Folders</span>
            <div className="grid grid-cols-2 gap-1.5">
              {foldersList.map(folder => (
                <button
                  id={`folder-tab-${folder.toLowerCase()}`}
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg border font-mono transition-all cursor-pointer flex justify-between items-center ${
                    selectedFolder === folder 
                      ? 'bg-slate-900 border-slate-700 text-white font-semibold' 
                      : 'bg-slate-950 border-slate-900/60 text-slate-400 hover:text-slate-300 hover:bg-slate-900/30'
                  }`}
                >
                  {folder}
                  {folder === 'All' && <span className="text-[10px] text-cyan-400 font-mono">({documents.length})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} id="search-form" className="relative">
            <input 
              type="text" 
              placeholder="Query keywords (e.g. 'ACH', 'Evelyn', 'Uptime')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-8 py-2 text-xs focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); fetchDocuments(); }}
                className="absolute right-2.5 top-1 px-1.5 py-0.5 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-md cursor-pointer"
              >
                Clear
              </button>
            )}
          </form>

          {/* Document list */}
          <div id="documents-vault-list" className="flex-1 flex flex-col gap-2 min-h-[220px]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">Active Vault Files</span>
            
            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-900 rounded-xl text-xs text-slate-500">
                  No documents found in folder {selectedFolder}.
                </div>
              ) : (
                filteredDocuments.map(doc => {
                  const isActive = doc.id === selectedDocId;
                  const formattedCost = doc.metadata?.['Total Amount'] || doc.metadata?.['Hourly Rate'] || '';
                  return (
                    <div
                      id={`doc-row-${doc.id}`}
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                        isActive 
                          ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-cyan-500/80 shadow-lg shadow-cyan-950/20' 
                          : 'bg-slate-950 border-slate-900 hover:border-slate-800 hover:bg-slate-900/10'
                      }`}
                    >
                      <div className="flex gap-2.5">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          doc.type === DocumentType.INVOICE ? 'bg-emerald-950 text-emerald-400' :
                          doc.type === DocumentType.CONTRACT ? 'bg-indigo-950 text-indigo-400' :
                          'bg-amber-950 text-amber-400'
                        }`}>
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-semibold font-mono truncate max-w-[170px] ${isActive ? 'text-cyan-400' : 'text-slate-200'}`}>
                            {doc.name}
                          </h4>
                          <div className="flex flex-wrap gap-1.5 items-center mt-1">
                            <span className="text-[9.5px] text-slate-500 font-mono">
                              Conf: <strong className={doc.confidence > 95 ? 'text-emerald-400' : 'text-amber-400'}>{doc.confidence}%</strong>
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-mono">| {doc.size}</span>
                            {formattedCost && (
                              <span className="text-[9px] bg-slate-900 text-teal-300 font-mono px-1 rounded border border-slate-800">
                                {formattedCost}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(doc.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                        <button
                          id={`btn-delete-${doc.id}`}
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-900 transition-all cursor-pointer"
                          title="Purge Document Securely"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </aside>

        {/* COL 2: Document Workspace (xl:col-span-6) */}
        <main id="workspace-panel" className="xl:col-span-6 border-r border-slate-900 bg-slate-950 flex flex-col overflow-y-auto">
          
          {activeDoc ? (
            <div className="flex-1 flex flex-col">
              
              {/* Document Overview Header banner */}
              <div id="vault-doc-header" className="p-6 border-b border-slate-900 bg-slate-900/10 flex flex-wrap justify-between items-center gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-cyan-950 text-cyan-400 font-mono px-2.5 py-0.5 rounded-full border border-cyan-900 uppercase">
                      Vault Document #{activeDoc.id.substring(4, 10)}
                    </span>
                    <span className="text-[10px] bg-slate-900 text-slate-400 font-mono px-2.5 py-0.5 rounded-full border border-slate-800">
                      V{activeDoc.versions.length}.0 Active
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1.5 font-mono tracking-tighttruncate">
                    {activeDoc.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    {activeDoc.summary.short}
                  </p>
                </div>

                {/* Convert / Export Downloader Buttons */}
                <div className="relative">
                  <button
                    id="btn-export-menu-toggle"
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    Convert & Export
                    <ChevronDown size={14} />
                  </button>

                  {isExportMenuOpen && (
                    <div id="export-dropdown" className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 overflow-hidden">
                      <div className="px-3.5 py-2 border-b border-slate-800/80">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Preserve Layout Format</span>
                      </div>
                      <div className="p-1 flex flex-col">
                        <button onClick={() => triggerSimulationDownload('pdf')} className="text-left text-xs text-slate-300 hover:text-white hover:bg-slate-850 px-3 py-2 rounded-lg font-mono flex items-center justify-between cursor-pointer w-full">
                          <span>Secure PDF (.pdf)</span>
                          <span className="text-[9px] text-emerald-400 font-mono">Ready</span>
                        </button>
                        <button onClick={() => triggerSimulationDownload('word')} className="text-left text-xs text-slate-300 hover:text-white hover:bg-slate-850 px-3 py-2 rounded-lg font-mono flex items-center justify-between cursor-pointer w-full">
                          <span>Word Doc (.docx)</span>
                          <span className="text-[9px] text-indigo-400 font-mono">AI Map</span>
                        </button>
                        <button onClick={() => triggerSimulationDownload('excel')} className="text-left text-xs text-slate-300 hover:text-white hover:bg-slate-850 px-3 py-2 rounded-lg font-mono flex items-center justify-between cursor-pointer w-full">
                          <span>Excel Sheet (.xlsx)</span>
                          <span className="text-[9px] text-teal-400 font-mono">Tables</span>
                        </button>
                        <button onClick={() => triggerSimulationDownload('csv')} className="text-left text-xs text-slate-300 hover:text-white hover:bg-slate-850 px-3 py-2 rounded-lg font-mono flex items-center justify-between cursor-pointer w-full">
                          <span>Delimited CSV (.csv)</span>
                          <span className="text-[9px] text-cyan-400 font-mono">D3 ready</span>
                        </button>
                        <button onClick={() => triggerSimulationDownload('json')} className="text-left text-xs text-slate-300 hover:text-white hover:bg-slate-850 px-3 py-2 rounded-lg font-mono flex items-center justify-between cursor-pointer w-full">
                          <span>JSON Tree (.json)</span>
                          <span className="text-[9px] text-amber-500 font-mono">Schemas</span>
                        </button>
                        <button onClick={() => triggerSimulationDownload('markdown')} className="text-left text-xs text-slate-300 hover:text-white hover:bg-slate-850 px-3 py-2 rounded-lg font-mono flex items-center justify-between cursor-pointer w-full">
                          <span>Markdown (.md)</span>
                          <span className="text-[9px] text-indigo-300 font-mono">Parsed</span>
                        </button>
                        <button onClick={() => triggerSimulationDownload('text')} className="text-left text-xs text-slate-300 hover:text-white hover:bg-slate-850 px-3 py-2 rounded-lg font-mono flex items-center justify-between cursor-pointer w-full">
                          <span>Plain Text (.txt)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fast Metadata Pills Bar */}
              <div id="metadata-strip" className="bg-slate-900/20 px-6 py-3 border-b border-slate-900 flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Extracted Metadata:</span>
                
                {Object.entries(activeDoc.metadata).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} className="bg-slate-900/65 border border-slate-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] text-slate-300">
                      <span className="text-slate-500">{key}:</span>
                      <strong className="text-cyan-400">{value}</strong>
                    </div>
                  );
                })}

                <div className="ml-auto flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span>Category:</span>
                  <span className="text-indigo-400 font-bold bg-indigo-950/40 border border-indigo-900 px-2 py-0.5 rounded text-[10px]">
                    {activeDoc.category.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Workspace Navigation Tabs BAR */}
              <div id="workspace-tabs" className="border-b border-slate-900 bg-slate-950 px-6 flex flex-wrap gap-1">
                <button
                  id="tab-btn-layout"
                  onClick={() => setActiveWorkspaceTab('layout')}
                  className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeWorkspaceTab === 'layout' 
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  OCR Layout & Tables
                </button>
                <button
                  id="tab-btn-translate"
                  onClick={() => setActiveWorkspaceTab('translate')}
                  className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeWorkspaceTab === 'translate' 
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  AI Translation
                </button>
                <button
                  id="tab-btn-rewrite"
                  onClick={() => setActiveWorkspaceTab('rewrite')}
                  className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeWorkspaceTab === 'rewrite' 
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Tone Editor
                </button>
                <button
                  id="tab-btn-compliance"
                  onClick={() => setActiveWorkspaceTab('compliance')}
                  className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeWorkspaceTab === 'compliance' 
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Compliance & Risks
                </button>
                <button
                  id="tab-btn-esign"
                  onClick={() => {
                    setActiveWorkspaceTab('esign');
                    setEsignName(currentUserEmail.split('@')[0]);
                    setEsignEmail(currentUserEmail);
                  }}
                  className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeWorkspaceTab === 'esign' 
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  E-Signature Sign-off
                </button>
                <button
                  id="tab-btn-version"
                  onClick={() => setActiveWorkspaceTab('version')}
                  className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeWorkspaceTab === 'version' 
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Publish Version ({activeDoc.versions.length}.0)
                </button>
              </div>

              {/* Tab Workspace content */}
              <div id="active-workspace-pane" className="p-6 flex-1 flex flex-col gap-6">
                
                {/* TAB 1: Layout & Extracted OCR */}
                {activeWorkspaceTab === 'layout' && (
                  <div id="pane-layout" className="flex flex-col gap-6">
                    
                    {/* Executive summaries cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 font-mono block mb-1">Executive Summary</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeDoc.summary.executive}</p>
                      </div>
                      <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 font-mono block mb-1">Extracted Key Points</span>
                        <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 font-sans">
                          {activeDoc.summary.bullets.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Left text pane + Layout preserving side list */}
                    <div className="flex flex-col gap-4">
                      <div className="border border-slate-900 bg-slate-950 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-900/40 px-4 py-2 border-b border-slate-900 flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                            Full Accurate OCR Text Flow
                          </span>
                          <span className="text-[10px] bg-emerald-900/80 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded font-mono">
                            OCR confidence: {activeDoc.confidence}%
                          </span>
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <pre id="ocr-plaintext-render" className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-text bg-slate-950 p-2 rounded-lg max-h-96 overflow-y-auto">
                            {activeDoc.extractedText}
                          </pre>
                        </div>
                      </div>

                      {/* Extracted Tables Section */}
                      {activeDoc.tables && activeDoc.tables.length > 0 && (
                        <div className="bg-slate-905 border border-slate-900 rounded-xl overflow-hidden flex flex-col">
                          <div className="bg-slate-900/40 px-4 py-2 border-b border-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                            <span>Tabular Intelligence Array ({activeDoc.tables.length} Table extracted)</span>
                            <span className="text-cyan-400">{activeDoc.tables[0].name || 'Dataset'}</span>
                          </div>
                          
                          {activeDoc.tables.map((tbl, i) => (
                            <div key={tbl.id || i} className="overflow-x-auto p-4 bg-slate-950">
                              <table className="w-full text-left text-xs font-mono border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-800 bg-slate-900/50">
                                    {tbl.headers.map((h, hi) => (
                                      <th key={hi} className="p-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-900">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900">
                                  {tbl.rows.map((row, ri) => (
                                    <tr key={ri} className="hover:bg-slate-900/20">
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="p-2 text-slate-300 border-r border-slate-950 text-[11.5px]">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metadata Details Tables */}
                      <div className="bg-slate-900/10 border border-slate-900 p-4 rounded-xl flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Simulated Original File Properties</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                            <span className="text-[10px] text-slate-500 block">Doc Source Hash</span>
                            <span className="text-[11px] text-white overflow-hidden text-ellipsis block">SHA256-{activeDoc.id}</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                            <span className="text-[10px] text-slate-500 block">MIME Stream</span>
                            <span className="text-[11px] text-white">{activeDoc.mimeType}</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                            <span className="text-[10px] text-slate-500 block">Organization Folder</span>
                            <span className="text-[11px] text-indigo-400">{activeDoc.folderName}</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                            <span className="text-[10px] text-slate-500 block">Classification Vault</span>
                            <span className="text-[11px] text-emerald-400">Classified AAA</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 2: AI Translation */}
                {activeWorkspaceTab === 'translate' && (
                  <div id="pane-translate" className="bg-slate-900/25 border border-slate-900 p-5 rounded-xl flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-sm font-bold text-slate-200">DocuMind AI Multi-lingual Translation Hub</h3>
                      <p className="text-xs text-slate-400">
                        Convert extracted OCR structures into target global business languages side-by-side using Gemini AI, preserving underlying corporate tokens.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <label className="text-xs font-mono text-slate-400">Select Target Language:</label>
                      <select 
                        value={transLanguage}
                        onChange={(e) => setTransLanguage(e.target.value)}
                        className="bg-slate-900 text-slate-100 border border-slate-800 rounded px-2 py-1 text-xs font-mono focus:outline-none"
                      >
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="French">French (Français)</option>
                        <option value="German">German (Deutsch)</option>
                        <option value="Hindi">Hindi (हिन्दी)</option>
                        <option value="Japanese">Japanese (日本語)</option>
                        <option value="Mandarin">Mandarin (中文)</option>
                      </select>
                      
                      <button
                        id="btn-run-translation"
                        onClick={handleTranslateRun}
                        disabled={transLoading}
                        className="ml-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
                      >
                        {transLoading ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            Translating via Gemini...
                          </>
                        ) : (
                          <>
                            <Languages size={13} />
                            Translate Layout
                          </>
                        )}
                      </button>
                    </div>

                    {/* Box outputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-405 font-bold">Source Standard OCR (English)</span>
                        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 max-h-[350px] overflow-y-auto text-xs font-mono text-slate-400 leading-relaxed whitespace-pre-wrap">
                          {activeDoc.extractedText}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Translated Output ({transLanguage})</span>
                        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 max-h-[350px] overflow-y-auto text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[300px] flex flex-col justify-between">
                          {translatedContent ? (
                            <div>{translatedContent}</div>
                          ) : (
                            <div className="text-slate-500 italic text-center py-16">
                              {transLoading ? 'Awaiting smart neural stream...' : `Click "Translate Layout" above to generate high fidelity translated outputs`}
                            </div>
                          )}
                          {translatedContent && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(translatedContent);
                                triggerToast('Copied translated layout to clipboard.');
                              }}
                              className="self-end mt-4 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850 px-2 py-1 rounded cursor-pointer"
                            >
                              Copy Content
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Tone Rewriter */}
                {activeWorkspaceTab === 'rewrite' && (
                  <div id="pane-rewrite" className="bg-slate-900/25 border border-slate-900 p-5 rounded-xl flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-sm font-bold text-slate-200">Document Drafting & AI Smart Tone Re-writer</h3>
                      <p className="text-xs text-slate-400">
                        Adjust vocabulary complexity and formal flow parameters. Choose a target occupational theme to rewrite the extracted OCR document draft.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <label className="text-xs font-mono text-slate-400">Target Drafting Persona/Tone:</label>
                      <div className="flex gap-1.5">
                        {['Formal', 'Technical', 'Business', 'Academic', 'Legal'].map(t => (
                          <button
                            id={`btn-tone-${t.toLowerCase()}`}
                            key={t}
                            onClick={() => setRewriteTone(t)}
                            className={`px-2.5 py-1 text-xs rounded-md font-mono border transition-all cursor-pointer ${
                              rewriteTone === t 
                                ? 'bg-cyan-950 text-cyan-400 border-cyan-800 font-semibold' 
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      <button
                        id="btn-run-rewrite"
                        onClick={handleRewriteRun}
                        disabled={rewriteLoading}
                        className="ml-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
                      >
                        {rewriteLoading ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            Drafting...
                          </>
                        ) : (
                          <>
                            <Edit3 size={13} />
                            Rewrite Layout
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-405 font-bold">Source Standard Documents Copy</span>
                        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 max-h-[350px] overflow-y-auto text-xs font-mono text-slate-400 leading-relaxed whitespace-pre-wrap">
                          {activeDoc.extractedText}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Pruned Intelligent Version ({rewriteTone})</span>
                        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 max-h-[350px] overflow-y-auto text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[300px] flex flex-col justify-between">
                          {rewrittenContent ? (
                            <div>{rewrittenContent}</div>
                          ) : (
                            <div className="text-slate-500 italic text-center py-16">
                              {rewriteLoading ? 'Recalculating structural parameters...' : `Select a tone option and click "Rewrite Layout"`}
                            </div>
                          )}
                          {rewrittenContent && (
                            <div className="flex gap-2 justify-end mt-4">
                              <button
                                onClick={() => {
                                  setEditingContent(rewrittenContent);
                                  setActiveWorkspaceTab('version');
                                  triggerToast('Loaded rewritten content into active workspace editor.');
                                }}
                                className="text-[10px] bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-2.5 py-1 rounded-md cursor-pointer"
                              >
                                Load as Draft
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(rewrittenContent);
                                  triggerToast('Copied content.');
                                }}
                                className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850 px-2.5 py-1 rounded-md cursor-pointer"
                              >
                                Copy Content
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Compliance & Risk Reports */}
                {activeWorkspaceTab === 'compliance' && (
                  <div id="pane-compliance" className="flex flex-col gap-6">
                    
                    {/* Compliance header card */}
                    {activeDoc.complianceReport ? (
                      <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              System Compliance Analysis Report
                              <span className={`text-[10.5px] font-mono px-2 py-0.5 rounded-full uppercase border font-semibold ${
                                activeDoc.complianceReport.status === 'compliant' 
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-900' 
                                  : activeDoc.complianceReport.status === 'warning'
                                  ? 'bg-amber-950 text-amber-400 border-amber-900'
                                  : 'bg-rose-950 text-rose-400 border-rose-900'
                              }`}>
                                {activeDoc.complianceReport.status}
                              </span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Vulnerability scan executed automatically under SEC policy frameworks.
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2.5 bg-slate-950 px-4 py-2 rounded-xl border border-slate-850">
                            <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Integrity Score</span>
                            <span className="text-lg font-mono font-bold text-white">
                              <span className={activeDoc.complianceReport.score >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
                                {activeDoc.complianceReport.score}
                              </span>
                              <span className="text-xs text-slate-500"> / 100</span>
                            </span>
                          </div>
                        </div>

                        {/* Checklist grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {activeDoc.complianceReport.checklist.map((chk, idx) => (
                            <div key={idx} className="bg-slate-950 border border-slate-900/60 p-3 rounded-lg flex items-center justify-between">
                              <span className="text-xs text-slate-300 font-mono">{chk.item}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                chk.status === 'pass' 
                                  ? 'bg-emerald-950/40 text-emerald-400 font-semibold' 
                                  : 'bg-amber-950/40 text-amber-400 font-semibold'
                              }`}>
                                {chk.status.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Identified issues listings */}
                        {activeDoc.complianceReport.issues.length > 0 && (
                          <div className="flex flex-col gap-2.5 mt-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-430 font-mono">Discovered Issues & Actionable Fixes</span>
                            <div className="flex flex-col gap-2">
                              {activeDoc.complianceReport.issues.map((iss, i) => (
                                <div key={i} className="bg-slate-950/70 border border-slate-900 text-xs p-3.5 rounded-lg flex flex-col gap-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-200 font-mono text-[12px]">{iss.field}</span>
                                    <span className="text-[9px] bg-rose-955 text-rose-400 border border-rose-900 font-mono px-2 py-0.2 rounded uppercase">
                                      {iss.severity} risk
                                    </span>
                                  </div>
                                  <p className="text-slate-400">{iss.message}</p>
                                  <div className="bg-slate-900 p-2 rounded text-[11px] text-cyan-300 font-mono leading-relaxed mt-1">
                                    <strong className="text-slate-400">Resolution Suggestion:</strong> {iss.suggestedFix}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-900/10 border border-slate-900/60 rounded-xl p-8 text-center text-xs text-slate-500">
                        No automated compliance schema exists for this file format type.
                      </div>
                    )}

                    {/* Contract insights risks */}
                    {activeDoc.contractInsights && (
                      <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-5 flex flex-col gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-205 flex items-center justify-between">
                            Legal Exposure & SLA Obligations Insights
                            <span className="text-[9.5px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono">Apex Legal Module</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Discovered high exposure liability clauses extracted via Gemini AI parsing.
                          </p>
                        </div>

                        {/* Critical values strip */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                            <span className="text-slate-500 text-[10.5px]">Contract Termination Period</span>
                            <span className="text-white font-bold block mt-1 text-[12.5px]">{activeDoc.contractInsights.expiryDate || 'N/A / Indefinite'}</span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                            <span className="text-slate-500 text-[10.5px]">Billed Compensation Terms</span>
                            <span className="text-cyan-400 font-bold block mt-1 text-[12.5px]">{activeDoc.contractInsights.paymentTerms || 'Standard B2B Terms'}</span>
                          </div>
                        </div>

                        {activeDoc.contractInsights.riskClauses.length > 0 && (
                          <div className="flex flex-col gap-2.5 mt-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Active Risk Clause Mitigation Profiles</span>
                            
                            <div className="flex flex-col gap-3">
                              {activeDoc.contractInsights.riskClauses.map((clause, idx) => (
                                <div key={idx} className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-indigo-300 font-mono">{clause.type}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-mono tracking-wider ${
                                      clause.riskLevel === 'high' ? 'bg-rose-950 text-rose-400 border border-rose-900' : 'bg-amber-950 text-amber-400 border border-amber-900'
                                    }`}>
                                      {clause.riskLevel} exposure
                                    </span>
                                  </div>
                                  
                                  <blockquote className="bg-slate-900/60 pl-3.5 py-1.5 border-l-2 border-slate-700 text-[11.5px] text-slate-400 italic">
                                    "{clause.originalText}"
                                  </blockquote>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5 text-[11.5px]">
                                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                                      <span className="text-rose-400 font-mono text-[9.5px] uppercase font-bold block mb-0.5">Underlying Implication</span>
                                      <p className="text-slate-300">{clause.implication}</p>
                                    </div>
                                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                                      <span className="text-emerald-400 font-mono text-[9.5px] uppercase font-bold block mb-0.5">Enterprise Counter-Mitigation</span>
                                      <p className="text-slate-300">{clause.mitigation}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: E-Signature sign-off */}
                {activeWorkspaceTab === 'esign' && (
                  <div id="pane-esign" className="bg-slate-900/25 border border-slate-900 p-5 rounded-xl flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-sm font-bold text-slate-205 flex items-center gap-2">
                        <FileSignature size={18} className="text-cyan-400" />
                        Apex Cryptographic E-Signature Terminal
                      </h3>
                      <p className="text-xs text-slate-400">
                        Electronically approve or certify extracting invoice details or SLA contracts. This action appends a verified compliance hash into the public audit trail.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      
                      {/* Form (md:col-span-6) */}
                      <form onSubmit={handleSignDocument} className="md:col-span-6 flex flex-col gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Submit Approval Signature</span>
                        
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">AUTHORIZED SIGNER FULL-NAME</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Director Evelyn Martinez"
                            value={esignName}
                            onChange={(e) => setEsignName(e.target.value)}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">VERIFIED BUSINESS EMAIL</label>
                          <input 
                            type="email" 
                            required
                            placeholder="e.g. martinez@corp.global"
                            value={esignEmail}
                            onChange={(e) => setEsignEmail(e.target.value)}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] text-slate-500">SIGNATURE MARK (TYPED OR VECTOR)</label>
                            <button
                              type="button"
                              onClick={() => setEsignDraw('// APPROVED DIGITAL DISCHARGE SEC_CODE_842')}
                              className="text-[9px] text-cyan-400 bg-cyan-950 border border-cyan-900 px-1.5 py-0.2 rounded"
                            >
                              Simulate Draw
                            </button>
                          </div>
                          
                          <input 
                            type="text" 
                            placeholder="Draw or enter seal text, e.g. /E. Martinez/ Apex..."
                            value={esignDraw}
                            onChange={(e) => setEsignDraw(e.target.value)}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-mono italic text-cyan-400"
                          />
                        </div>

                        <button
                          type="submit"
                          className="mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 py-2 rounded font-bold uppercase tracking-wider text-[11px] transition duration-200 cursor-pointer"
                        >
                          Affix Cryptographic Signature
                        </button>
                      </form>

                      {/* Previous signatures list (md:col-span-6) */}
                      <div className="md:col-span-6 flex flex-col gap-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Affixed Document Approvals ({activeDoc.eSignatures.length})</span>
                        
                        <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[220px]">
                          {activeDoc.eSignatures.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 italic text-xs">
                              Awaiting authority validation. This agreement is non-executed.
                            </div>
                          ) : (
                            activeDoc.eSignatures.map(sign => (
                              <div key={sign.id} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex flex-col gap-1 text-xs">
                                <div className="flex justify-between items-center font-mono">
                                  <strong className="text-white font-semibold">{sign.signerName}</strong>
                                  <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-semibold uppercase">
                                    {sign.status}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{sign.signerEmail}</span>
                                <div className="flex gap-2 items-center justify-between text-[10px] text-slate-550 italic bg-slate-950 p-1.5 rounded mt-1 border border-slate-900 font-mono">
                                  <span className="text-cyan-400 truncate max-w-[150px]" title={sign.signatureDraw}>{sign.signatureDraw}</span>
                                  <span className="text-[9px] text-slate-500 font-normal">{sign.signedAt ? new Date(sign.signedAt).toLocaleDateString() : ''}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 6: Revision control & Edit text versioning */}
                {activeWorkspaceTab === 'version' && (
                  <form onSubmit={handleVersionSave} id="version-drafting-form" className="bg-slate-900/25 border border-slate-900 p-5 rounded-xl flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-sm font-bold text-slate-205 flex items-center justify-between">
                        Document Editor & Revision Release Portal
                        <span className="text-[10px] text-slate-400 font-mono">Active Version: {activeDoc.versions.length}.0</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Manually override OCR text faults or update values. Saving registers a clean New Version, keeping track of complete chronological history.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      
                      {/* Main Edit Column */}
                      <div className="md:col-span-8 flex flex-col gap-2">
                        <span className="text-[10px] font-mono uppercase text-slate-450 font-semibold">Active Raw Markdown Content Draft</span>
                        <textarea
                          rows={11}
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-850 rounded-xl p-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-cyan-500 transition-all"
                        />
                      </div>

                      {/* Commit details panel */}
                      <div className="md:col-span-4 flex flex-col gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Release Action parameters</span>
                        
                        <div>
                          <label className="block text-[10px] text-slate-550 mb-1">REVISION SUMMARY</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Corrected routing number typo..."
                            value={versionChangeNote}
                            onChange={(e) => setVersionChangeNote(e.target.value)}
                            className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded px-2 py-1.5 text-xs focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-550 mb-1">AUTHOR SECURITY INITIALS</label>
                          <input 
                            type="text"
                            value={currentUserEmail}
                            disabled
                            className="w-full bg-slate-900/50 text-slate-400 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono"
                          />
                        </div>

                        <button 
                          id="btn-version-save-commit"
                          type="submit"
                          disabled={versionLoading}
                          className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          {versionLoading ? 'Securing parameters...' : 'Publish New Version'}
                        </button>

                        <div className="mt-4 pt-4 border-t border-slate-900/60 flex flex-col gap-2">
                          <span className="text-[9.5px] uppercase font-bold text-slate-500 font-mono">Chronological History logs ({activeDoc.versions.length})</span>
                          
                          <div className="flex flex-col gap-2 overflow-y-auto max-h-[140px] pr-1">
                            {activeDoc.versions.map((ver, vIdx) => (
                              <div key={vIdx} className="bg-slate-900 p-2 rounded text-[10.5px] border border-slate-850">
                                <div className="flex justify-between font-mono text-[9px] mb-1">
                                  <span className="text-cyan-400 font-bold">V{ver.versionNo}.0</span>
                                  <span className="text-slate-500">{new Date(ver.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-300 font-normal italic">"{ver.changeSummary}"</p>
                                <span className="block text-[9.5px] text-slate-500 uppercase mt-1 font-mono">By {ver.author}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  </form>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="bg-slate-900 p-4 rounded-full text-slate-705 mb-4">
                <FileText size={40} />
              </div>
              <h3 className="text-lg font-bold font-mono text-white">No active document selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                Please select an active document in the sidebar folder categories or click on simulation presets to execute Gemini processing streams.
              </p>
            </div>
          )}

        </main>

        {/* COL 3: Contextual AI Assistant, Client Discussion Feed, and Security Logs Panel (xl:col-span-3) */}
        <section id="copilot-panel" className="xl:col-span-3 bg-slate-950 p-4 flex flex-col gap-4 overflow-y-auto">
          
          {/* Subsection: Semantic AI Chat Companion */}
          <div id="card-chat-companion" className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-2.5 min-h-[350px] max-h-[500px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              Context-Aware AI Companion
              <span className="text-[10px] bg-cyan-900/40 text-cyan-400 border border-cyan-900 px-1.5 rounded font-mono uppercase">Gemini 2.5 Flash</span>
            </h3>

            {/* Chats stream container */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 bg-slate-950 p-3 rounded-lg border border-slate-900 leading-relaxed min-h-[220px]">
              {chatMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col gap-1 max-w-[90%] text-xs ${
                    msg.sender === 'user' ? 'self-end bg-cyan-950 border border-cyan-850 text-slate-100 rounded-xl rounded-tr-none px-3 py-2' : 'self-start bg-slate-900 text-slate-200 border border-slate-800 rounded-xl rounded-tl-none px-3 py-2'
                  }`}
                >
                  <span className="text-[8.5px] text-slate-500 uppercase font-mono font-bold">
                    {msg.sender === 'user' ? 'Corporate Analyst' : 'DocuMind Intelligence'}
                  </span>
                  <div className="select-text whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="self-start bg-slate-900 border border-slate-800 rounded-xl rounded-tl-none px-3 py-2 text-xs flex items-center gap-1.5 text-slate-400 animate-pulse">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Gemini deep scanning files...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input forms */}
            <form onSubmit={handleChatSubmit} className="flex gap-1.5">
              <input
                disabled={!activeDoc || chatLoading}
                type="text"
                placeholder={activeDoc ? "Ask document details..." : "Load document to begin AI Chat"}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950 text-slate-100 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-55"
              />
              <button
                disabled={!activeDoc || chatLoading || !chatInput.trim()}
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-1.5 px-3 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                <Send size={13} />
              </button>
            </form>
          </div>

          {/* Subsection: Team Collaboration notes */}
          {activeDoc && (
            <div id="card-team-comments" className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Team Collaboration Notes ({activeDoc.comments.length})</span>
              
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {activeDoc.comments.length === 0 ? (
                  <p className="text-slate-500 text-[11px] italic py-2">No comments added yet. Tag colleagues to sign-off.</p>
                ) : (
                  activeDoc.comments.map(comm => (
                    <div key={comm.id} className="bg-slate-950 border border-slate-900 p-2 rounded text-xs">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-450 mb-0.5">
                        <span className="text-indigo-400 font-semibold">{comm.author}</span>
                        <span className="text-[9px] text-slate-500">{new Date(comm.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-slate-350">{comm.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="Type corporate note..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 bg-slate-950 text-slate-200 border border-slate-850 rounded px-2 py-1 text-xs focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-white px-2 py-1 rounded text-[11px] disabled:opacity-50 cursor-pointer"
                >
                  Post
                </button>
              </form>
            </div>
          )}

          {/* ADM PANEL: Admin view & Security audit trails */}
          {userRole === 'Admin' ? (
            <div id="card-admin-view" className="bg-slate-900/40 border border-cyan-800/40 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
                  <Lock size={13} />
                  Enterprise Monitor (Admin)
                </h4>
                <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded font-mono uppercase">Full Access</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-350 bg-slate-950 p-2.5 rounded border border-slate-900">
                <div>
                  <span className="text-slate-500 text-[10px] block">Corporate Users</span>
                  <strong className="text-slate-100">{adminStats?.totalUsers || 4} Active Seats</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">SaaS Storage Limit</span>
                  <strong className="text-slate-100">2.14 / 20 GB</strong>
                </div>
              </div>

              {/* Users directory */}
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-[10px] font-semibold uppercase text-slate-500 font-mono tracking-wide px-1">Registered Tenant Seats</span>
                <div className="flex flex-col gap-1 max-h-[110px] overflow-y-auto">
                  {adminUsers.map((u, i) => (
                    <div key={i} className="bg-slate-950 p-1.5 rounded border border-slate-900 flex justify-between items-center">
                      <div className="font-mono text-[11px]">
                        <span className="text-slate-200 block truncate max-w-[130px]">{u.email}</span>
                        <span className="text-[9px] text-slate-500">Tier: <strong className="text-cyan-400">{u.plan}</strong></span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded ${u.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {u.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Audit Trails Logs list */}
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono px-1">Vault Dispatch Access Logs</span>
                <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {auditLogs.map((log, i) => (
                    <div key={log.id || i} className="bg-slate-950/80 border border-slate-900 rounded p-2 text-[10.5px] leading-relaxed">
                      <div className="flex justify-between font-mono text-[9px] text-slate-450 mb-1">
                        <span className="text-indigo-400 font-semibold truncate max-w-[100px]" title={log.action}>{log.action}</span>
                        <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                      </div>
                      <p className="text-slate-300 font-sans">{log.details}</p>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                        <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                        <span>{log.userEmail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div id="card-security-preview" className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                Security Audit Log Preview
                <span className="text-[9px] text-slate-500">Read Only</span>
              </span>
              
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                {auditLogs.slice(0, 3).map((log, i) => (
                  <div key={log.id || i} className="bg-slate-950/80 p-2 rounded text-[10px] border border-slate-900/60 leading-normal">
                    <div className="flex justify-between font-mono text-[9px] text-slate-500">
                      <span className="text-indigo-400 font-medium truncate max-w-[110px]">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-slate-400 font-sans mt-0.5 truncate">{log.details}</p>
                  </div>
                ))}
              </div>

              <div className="text-center pt-1.5 border-t border-slate-900/60">
                <button
                  id="btn-admin-view-shortcut"
                  onClick={() => {
                    setUserRole('Admin');
                    triggerToast('Switched to compliance Admin Mode.');
                  }}
                  className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  Switch role to Admin to view full Tenant seat list & Audit Logs
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>
          )}

        </section>

      </div>

      {/* Humble, clean outer footer */}
      <footer id="app-footer" className="border-t border-slate-900 bg-slate-950 px-6 py-3 text-center text-slate-500 text-xs font-mono flex flex-wrap justify-between items-center gap-2">
        <span>DocuMind AI © 2026. Processed securely within Cloud Isolation Sandboxes.</span>
        <div id="api-status-pills" className="flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Gemini Flash Endpoint
          </span>
          <span className="h-2 w-px bg-slate-800"></span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            SaaS Convert Host
          </span>
        </div>
      </footer>

    </div>
  );
}
