import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem, 
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid/DataGrid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  Plus, 
  Minus,
  AlertCircle, 
  Package, 
  Clock, 
  TrendingDown, 
  Search,
  Download,
  Users,
  ShieldCheck,
  Thermometer,
  Truck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Info,
  IndianRupee,
  Activity,
  Stethoscope,
  LogOut,
  AlertOctagon
} from 'lucide-react';
import axios from 'axios';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const API_BASE_URL = 'http://localhost:8000';
const queryClient = new QueryClient();

// --- THEME ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#34d399' }, 
    secondary: { main: '#60a5fa' },
    background: { default: '#020617', paper: '#0f172a' },
    warning: { main: '#fbbf24' },
    error: { main: '#f87171' },
    text: { primary: '#f8fafc', secondary: '#94a3b8' }
  },
  typography: { fontFamily: '"Inter", "system-ui", sans-serif', h6: { fontWeight: 800 } },
  components: {
    MuiCard: { styleOverrides: { root: { backgroundColor: alpha('#1e293b', 0.4), backdropFilter: 'blur(16px)', border: `1px solid ${alpha('#ffffff', 0.08)}`, borderRadius: 16 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 } } }
  }
});

// --- TYPES ---
interface Supplier { id: string; name: string; contact_person: string; phone: string; email: string; address: string; }
interface MedicalStockItem {
  id: string; name: string; brand_name?: string; strength: string; invoice_no: string; batch_no: string;
  mfg_date: string; exp_date: string; quantity: number; unit: string; storage_condition: string;
  storage_location: string; unit_cost: number; reorder_threshold: number; category: string;
  vendor?: Supplier; usage_logs: any[];
}
interface Stats {
  total_items: number; items_expiring_soon: number; safe_items: number; monitoring_items: number;
  expired_items: number; low_stock_items: number; total_inventory_value: number;
}

// --- UTILS ---
const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
const getExpiryStatus = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (d < now) return { label: 'DO NOT USE', color: '#f87171' };
  if (diff < 3) return { label: 'CRITICAL', color: '#fb923c' };
  if (diff < 6) return { label: 'MONITOR', color: '#fbbf24' };
  return { label: 'SAFE', color: '#34d399' };
};

// --- SUB-COMPONENTS ---
const LegendItem = ({ color, label }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 12px ${color}` }} />
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>{label}</Typography>
  </Box>
);

const StatCard = ({ title, value, sub, color, icon }: any) => (
  <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 12px 24px ${alpha(color, 0.15)}` } }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>{title}</Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, my: 1, color }}>{value}</Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.3) }}>{sub}</Typography>
        </Box>
        <Box sx={{ p: 1.8, borderRadius: 4, bgcolor: alpha(color, 0.08), color }}>{React.cloneElement(icon, { size: 28 })}</Box>
      </Box>
    </CardContent>
  </Card>
);

const DetailItem = ({ icon, label, value }: any) => (
  <Box sx={{ display: 'flex', gap: 1.5, py: 1 }}>
    <Box sx={{ color: alpha('#fff', 0.4) }}>{React.cloneElement(icon, { size: 16 })}</Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>{value || 'N/A'}</Typography>
    </Box>
  </Box>
);

// --- MAIN DASHBOARD ---
const Dashboard = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDeduct, setOpenDeduct] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MedicalStockItem | null>(null);
  const [deductAmount, setDeductAmount] = useState(1);
  const [handledBy, setHandledBy] = useState('');
  const [digitalSignature, setDigitalSignature] = useState('');

  const [newBatch, setNewBatch] = useState({
    name: '', brand_name: '', strength: '', invoice_no: '', batch_no: '', mfg_date: '', exp_date: '',
    quantity: 0, unit: 'Tablets', storage_condition: 'Room Temp', storage_location: '', unit_cost: 0,
    reorder_threshold: 10, category: 'Tablet', vendor_id: ''
  });

  const { data: stats } = useQuery<Stats>({ queryKey: ['stats'], queryFn: () => axios.get(`${API_BASE_URL}/stats`).then(res => res.data), refetchInterval: 5000 });
  const { data: medicines = [] } = useQuery<MedicalStockItem[]>({ queryKey: ['medicines'], queryFn: () => axios.get(`${API_BASE_URL}/medicines`).then(res => res.data), refetchInterval: 5000 });
  const { data: vendors = [] } = useQuery<Supplier[]>({ queryKey: ['vendors'], queryFn: () => axios.get(`${API_BASE_URL}/vendors`).then(res => res.data) });
  const { data: detailedMedicine } = useQuery<MedicalStockItem>({ queryKey: ['medicine', selectedItem?.id], queryFn: () => axios.get(`${API_BASE_URL}/medicines/${selectedItem?.id}`).then(res => res.data), enabled: !!selectedItem?.id && drawerOpen });

  const deductMutation = useMutation({
    mutationFn: (data: any) => axios.post(`${API_BASE_URL}/logs`, data),
    onSuccess: () => { queryClient.invalidateQueries(); setOpenDeduct(false); setHandledBy(''); setDigitalSignature(''); }
  });

  const addBatchMutation = useMutation({
    mutationFn: (data: any) => axios.post(`${API_BASE_URL}/medicines`, data),
    onSuccess: () => { queryClient.invalidateQueries(); setOpenAdd(false); }
  });

  const handleExportCSV = () => {
    const headers = ["Medicine", "Brand", "Strength", "Batch", "EXP Date", "Stock", "Unit", "Category", "Storage Location", "Supplier"];
    const rows = medicines.map(m => [m.name, m.brand_name || 'N/A', m.strength || 'N/A', m.batch_no, m.exp_date, m.quantity, m.unit, m.category, m.storage_location, m.vendor?.name || 'N/A']);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `GHOPE_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const filteredMeds = useMemo(() => medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.batch_no.toLowerCase().includes(searchTerm.toLowerCase())), [medicines, searchTerm]);

  const columns: GridColDef[] = [
    { 
      field: 'name', headerName: 'Medicine / Brand', flex: 1.5, 
      renderCell: (params) => (
        <Box sx={{ py: 1.5, cursor: 'pointer' }} onClick={() => { setSelectedItem(params.row as MedicalStockItem); setDrawerOpen(true); }}>
          <Typography variant="body2" fontWeight="700" color="white" sx={{ '&:hover': { color: 'primary.main' } }}>{params.row.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{params.row.brand_name || 'Generic'} • Batch {params.row.batch_no}</Typography>
        </Box>
      )
    },
    { field: 'category', headerName: 'Category', width: 120, renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" sx={{ fontWeight: 600 }} /> },
    { 
      field: 'exp_date', headerName: 'Status', width: 160, 
      renderCell: (p) => {
        const s = getExpiryStatus(p.value as string);
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, boxShadow: `0 0 10px ${s.color}` }} />
              <Typography variant="caption" sx={{ color: s.color, fontWeight: 800, fontSize: '0.65rem' }}>{s.label}</Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.value}</Typography>
          </Box>
        );
      }
    },
    {
      field: 'quantity', headerName: 'Stock', width: 140,
      renderCell: (p) => {
        const isLow = (p.value as number) <= (p.row.reorder_threshold || 0);
        return (
          <Box sx={{ width: '100%', pr: 2 }}>
            <Typography variant="body2" fontWeight="800" color={isLow ? 'error.main' : 'primary.main'}>{p.value} {p.row.unit}</Typography>
            <LinearProgress variant="determinate" value={Math.min(((p.value as number) / ((p.row.reorder_threshold || 1) * 4)) * 100, 100)} sx={{ height: 4, borderRadius: 2, mt: 0.5, bgcolor: alpha('#fff', 0.05), '& .MuiLinearProgress-bar': { bgcolor: isLow ? 'error.main' : 'primary.main' } }} />
          </Box>
        );
      }
    },
    {
      field: 'actions', headerName: 'Actions', width: 140, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" sx={{ border: `1px solid ${alpha('#60a5fa', 0.2)}`, color: 'secondary.main' }} onClick={() => { setSelectedItem(p.row as MedicalStockItem); setDrawerOpen(true); }}><Info size={16} /></IconButton>
          <Button size="small" variant="contained" sx={{ px: 2, fontSize: '0.65rem', fontWeight: 800, bgcolor: alpha('#34d399', 0.1), color: 'primary.main', border: `1px solid ${alpha('#34d399', 0.4)}`, '&:hover': { bgcolor: 'primary.main', color: '#020617' } }} onClick={() => { setSelectedItem(p.row as MedicalStockItem); setOpenDeduct(true); }}>Deduct</Button>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="sticky" sx={{ bgcolor: alpha('#020617', 0.8), backdropFilter: 'blur(12px)', borderBottom: `1px solid ${alpha('#fff', 0.08)}`, elevation: 0 }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Activity size={28} className="text-emerald-400 mr-3" />
            <Box><Typography variant="h6" color="white" sx={{ lineHeight: 1.2 }}>GHOPE</Typography><Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: 1.5, fontSize: '0.6rem' }}>PHARMACY CORE</Typography></Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box sx={{ textAlign: 'right' }}><Typography variant="caption" sx={{ color: 'text.secondary' }}>Inventory Value</Typography><Typography variant="h6" color="primary.main">{formatCurrency(stats?.total_inventory_value || 0)}</Typography></Box>
            <Divider orientation="vertical" flexItem sx={{ border: `1px solid ${alpha('#fff', 0.08)}`, my: 1 }} />
            <IconButton sx={{ bgcolor: alpha('#fff', 0.03), border: `1px solid ${alpha('#fff', 0.08)}` }}><Users size={20} /></IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ py: 5, px: 4 }}>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={3}><StatCard title="Safe Stock" value={stats?.safe_items || 0} sub="> 6m Shelf Life" color="#34d399" icon={<ShieldCheck />} /></Grid>
          <Grid item xs={12} md={3}><StatCard title="Priority Monitor" value={stats?.monitoring_items || 0} sub="3-6m Shelf Life" color="#fbbf24" icon={<Clock />} /></Grid>
          <Grid item xs={12} md={3}><StatCard title="Expiring" value={stats?.items_expiring_soon || 0} sub="< 3m Shelf Life" color="#fb923c" icon={<AlertCircle />} /></Grid>
          <Grid item xs={12} md={3}><StatCard title="Critical" value={stats?.expired_items || 0} sub="Expired Items" color="#f87171" icon={<AlertOctagon />} /></Grid>
        </Grid>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setOpenAdd(true)} sx={{ bgcolor: 'primary.main', color: '#020617', px: 3.5, py: 1.2 }}>Add New Batch</Button>
          <Button variant="outlined" startIcon={<Download size={18} />} onClick={handleExportCSV} sx={{ px: 2.5, py: 1.2, borderColor: alpha('#fff', 0.1), color: 'text.primary' }}>Export Audit Report</Button>
          <Box sx={{ flexGrow: 1 }} />
          <TextField size="small" placeholder="Search by Name or Batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <Search size={18} className="mr-3 text-slate-500" />, sx: { borderRadius: '14px', bgcolor: alpha('#fff', 0.02), width: { xs: '100%', md: 400 }, border: `1px solid ${alpha('#fff', 0.08)}` } }} />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 3, mb: 3, p: 2, bgcolor: alpha('#fff', 0.02), borderRadius: 3, border: `1px solid ${alpha('#fff', 0.05)}` }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mr: 1 }}>LEGEND:</Typography>
          <LegendItem color="#34d399" label="Safe" /><LegendItem color="#fbbf24" label="Monitor" /><LegendItem color="#fb923c" label="Expiring" /><LegendItem color="#f87171" label="Expired" />
        </Box>

        <Paper sx={{ height: 720, borderRadius: 5, overflow: 'hidden', bgcolor: alpha('#0f172a', 0.3), backdropFilter: 'blur(20px)', border: `1px solid ${alpha('#fff', 0.05)}` }}>
          <DataGrid rows={filteredMeds} columns={columns} disableRowSelectionOnClick rowHeight={80} sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: alpha('#fff', 0.03), borderBottom: `1px solid ${alpha('#fff', 0.08)}`, color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }, '& .MuiDataGrid-cell': { borderBottom: `1px solid ${alpha('#fff', 0.03)}` } }} />
        </Paper>
      </Container>

      {/* Comprehensive Product Profile & Vendor Sidebar */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 520, bgcolor: '#020617', borderLeft: `1px solid ${alpha('#fff', 0.1)}`, backgroundImage: 'none' } }}>
        {selectedItem && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 4, bgcolor: alpha('#fff', 0.02), borderBottom: `1px solid ${alpha('#fff', 0.05)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#34d399', 0.1), color: '#34d399' }}><Stethoscope size={24} /></Box>
                <Box><Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2 }}>{selectedItem.name}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>{selectedItem.brand_name || 'Generic Product'}</Typography></Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip size="small" label={selectedItem.category} sx={{ fontWeight: 700, bgcolor: alpha('#fff', 0.05) }} />
                <Chip size="small" label={`Batch ${selectedItem.batch_no}`} sx={{ fontWeight: 700, bgcolor: alpha('#fff', 0.05), color: 'secondary.main' }} />
                <Chip size="small" label={selectedItem.strength} sx={{ fontWeight: 700, bgcolor: alpha('#34d399', 0.1), color: '#34d399' }} />
              </Box>
            </Box>

            <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.5, mb: 2, display: 'block' }}>Medical Specifications</Typography>
              <Grid container spacing={2} sx={{ mb: 5 }}>
                <Grid item xs={6}><DetailItem icon={<Clock />} label="MFG Date" value={selectedItem.mfg_date} /></Grid>
                <Grid item xs={6}><DetailItem icon={<AlertCircle />} label="EXP Date" value={selectedItem.exp_date} /></Grid>
                <Grid item xs={6}><DetailItem icon={<Thermometer />} label="Storage Zone" value={selectedItem.storage_location} /></Grid>
                <Grid item xs={6}><DetailItem icon={<IndianRupee />} label="Batch Unit Cost" value={formatCurrency(selectedItem.unit_cost)} /></Grid>
              </Grid>

              <Box sx={{ mb: 5, p: 3, bgcolor: alpha('#3b82f6', 0.03), borderRadius: 4, border: `1px solid ${alpha('#3b82f6', 0.1)}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}><Truck size={20} className="text-sky-400" /><Typography variant="overline" color="secondary.main" sx={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>Authorized Supplier</Typography></Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>{selectedItem.vendor?.name}</Typography>
                <List disablePadding>
                  <DetailItem icon={<Users />} label="Contact Person" value={selectedItem.vendor?.contact_person} />
                  <DetailItem icon={<Phone />} label="Direct Phone" value={selectedItem.vendor?.phone} />
                  <DetailItem icon={<Mail />} label="Registry Email" value={selectedItem.vendor?.email} />
                  <DetailItem icon={<MapPin />} label="Facility Address" value={selectedItem.vendor?.address} />
                </List>
              </Box>

              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.5, mb: 2, display: 'block' }}>Recent Usage History</Typography>
              {detailedMedicine?.usage_logs && detailedMedicine.usage_logs.length > 0 ? (
                <List sx={{ bgcolor: alpha('#fff', 0.02), borderRadius: 3, border: `1px solid ${alpha('#fff', 0.05)}` }}>
                  {detailedMedicine.usage_logs.map((log: any, idx: number) => (
                    <React.Fragment key={log.id}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}><Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha('#f87171', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}><Minus size={16} /></Box></ListItemIcon>
                        <ListItemText primary={<Typography variant="body2" fontWeight="bold">Deducted {log.quantity_deducted} {selectedItem.unit}</Typography>} secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>By {log.handled_by} • {new Date(log.timestamp).toLocaleString('en-IN')}</Typography>} />
                      </ListItem>
                      {idx < detailedMedicine.usage_logs.length - 1 && <Divider sx={{ borderColor: alpha('#fff', 0.05) }} />}
                    </React.Fragment>
                  ))}
                </List>
              ) : <Box sx={{ p: 4, textAlign: 'center', border: `1px dashed ${alpha('#fff', 0.1)}`, borderRadius: 3 }}><Typography variant="caption" sx={{ color: 'text.secondary' }}>No transaction history available.</Typography></Box>}
            </Box>
            <Box sx={{ p: 4, bgcolor: alpha('#fff', 0.02), borderTop: `1px solid ${alpha('#fff', 0.05)}` }}><Button fullWidth variant="contained" startIcon={<ExternalLink size={18} />} sx={{ py: 2, borderRadius: 3, bgcolor: alpha('#fff', 0.05), border: `1px solid ${alpha('#fff', 0.1)}`, color: 'white', '&:hover': { bgcolor: alpha('#fff', 0.1) } }}>Download Full Audit Trail</Button></Box>
          </Box>
        )}
      </Drawer>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} PaperProps={{ sx: { borderRadius: 5, width: '100%', maxWidth: 650, bgcolor: '#0f172a', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ p: 4, fontWeight: 900 }}>Register New Stock Batch</DialogTitle>
        <DialogContent sx={{ px: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, pt: 1 }}>
            <TextField label="Name" fullWidth value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} />
            <TextField label="Batch #" fullWidth value={newBatch.batch_no} onChange={e => setNewBatch({...newBatch, batch_no: e.target.value})} />
            <TextField label="EXP Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={newBatch.exp_date} onChange={e => setNewBatch({...newBatch, exp_date: e.target.value})} />
            <TextField select label="Supplier" fullWidth value={newBatch.vendor_id} onChange={e => setNewBatch({...newBatch, vendor_id: e.target.value})}>{vendors.map((v:any) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}</TextField>
            <TextField label="Quantity" type="number" fullWidth value={newBatch.quantity} onChange={e => setNewBatch({...newBatch, quantity: parseInt(e.target.value) || 0})} />
            <TextField label="Unit Cost" type="number" fullWidth value={newBatch.unit_cost} onChange={e => setNewBatch({...newBatch, unit_cost: parseFloat(e.target.value) || 0})} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4 }}><Button onClick={() => setOpenAdd(false)}>Cancel</Button><Button variant="contained" fullWidth onClick={() => addBatchMutation.mutate(newBatch)}>Confirm Entry</Button></DialogActions>
      </Dialog>

      {/* Deduct Dialog */}
      <Dialog open={openDeduct} onClose={() => setOpenDeduct(false)} PaperProps={{ sx: { borderRadius: 5, width: '100%', maxWidth: 450, bgcolor: '#0f172a', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ p: 4, fontWeight: 900 }}>Stock Withdrawal</DialogTitle>
        <DialogContent sx={{ px: 4 }}><Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}><Box sx={{ p: 3, bgcolor: alpha('#34d399', 0.05), borderRadius: 3, textAlign: 'center' }}><Typography variant="caption" color="primary.main">AVAILABLE</Typography><Typography variant="h4" fontWeight="bold">{selectedItem?.quantity} {selectedItem?.unit}</Typography></Box><TextField label="Quantity to Remove" type="number" fullWidth value={deductAmount} onChange={e => setDeductAmount(parseInt(e.target.value) || 1)} /><TextField select label="Issuing Volunteer" fullWidth value={handledBy} onChange={e => setHandledBy(e.target.value)}><MenuItem value="Dr. Sarah Chen">Dr. Sarah Chen</MenuItem><MenuItem value="Nurse Marcus">Nurse Marcus</MenuItem></TextField><TextField fullWidth placeholder="Type signature..." value={digitalSignature} onChange={e => setDigitalSignature(e.target.value)} sx={{ '& .MuiInputBase-root': { fontFamily: 'cursive' } }} /></Box></DialogContent>
        <DialogActions sx={{ p: 4 }}><Button onClick={() => setOpenDeduct(false)}>Cancel</Button><Button variant="contained" fullWidth color="error" onClick={() => deductMutation.mutate({ medicine_id: selectedItem?.id, quantity_deducted: deductAmount, handled_by: handledBy, signature_data: digitalSignature })} disabled={!handledBy || !digitalSignature}>Authorize</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

const App = () => (<QueryClientProvider client={queryClient}><ThemeProvider theme={darkTheme}><CssBaseline /><Dashboard /></ThemeProvider></QueryClientProvider>);
export default App;
