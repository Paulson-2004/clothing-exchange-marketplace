// Table row for the admin swap list.

function AdminSwapRow({ swap }) {
  const requesterName = swap.requester?.name || 'Unknown';
  const requestedTitle = swap.requestedListing?.title || 'Deleted listing';
  const requestedOwner = swap.requestedListing?.owner?.name || 'Unknown';
  const offeredTitle = swap.offeredListing?.title || 'Deleted listing';

  return (
    <tr className="admin-table-row">
      <td>
        <span className={`admin-badge admin-badge-${swap.status}`}>
          {swap.status}
        </span>
      </td>
      <td>{requesterName}</td>
      <td>{requestedTitle}</td>
      <td>{requestedOwner}</td>
      <td>{offeredTitle}</td>
      <td>{new Date(swap.createdAt).toLocaleDateString()}</td>
      <td>{new Date(swap.updatedAt).toLocaleDateString()}</td>
    </tr>
  );
}

export default AdminSwapRow;
